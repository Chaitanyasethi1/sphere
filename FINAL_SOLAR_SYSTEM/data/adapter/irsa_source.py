"""SPHEREx IRSA / IPAC Live & Cached Data Adapter.

Connects to NASA/IPAC Infrared Science Archive (IRSA) Simple Image Access (SIA2)
and loads verified SPHEREx Level 2 Multi-Extension FITS (MEF) spectral images.
Supports offline fallback on local cached FITS files.
"""

from __future__ import annotations

import glob
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import urllib.request

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from astropy.nddata import Cutout2D
from astropy.coordinates import SkyCoord
import astropy.units as u
from scipy.interpolate import RegularGridInterpolator

from data.adapter.base import EpochImage, EpochInfo, EpochSource, RegionInfo

logger = logging.getLogger(__name__)

IRSA_SIA2_ENDPOINT = "https://irsa.ipac.caltech.edu/SIA?"
DEFAULT_COLLECTION = "spherex_dr1"


class IrsaFitsSource(EpochSource):
    """Adapter for live & local SPHEREx FITS observations from NASA/IPAC IRSA."""

    def __init__(
        self,
        data_dir: Optional[str | Path] = None,
        endpoint: str = IRSA_SIA2_ENDPOINT,
        collection: str = DEFAULT_COLLECTION,
    ):
        self.data_dir = Path(data_dir or "data/raw")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.endpoint = endpoint
        self.collection = collection
        self._cached_records: Dict[str, Any] = {}

    def list_epochs(
        self,
        region: Optional[RegionInfo | Dict[str, Any]] = None,
        fov_deg: float = 0.2,
    ) -> List[EpochInfo]:
        """Query IRSA metadata service or local cache for observation epochs."""
        reg = RegionInfo.from_dict(region) if isinstance(region, dict) else (region or RegionInfo())

        # 1. First inspect local data_dir for existing verified FITS files
        fits_files = sorted(glob.glob(str(self.data_dir / "*.fits")))
        local_epochs: List[EpochInfo] = []

        for idx, fpath in enumerate(fits_files, start=1):
            try:
                with fits.open(fpath) as hdul:
                    header = hdul["IMAGE"].header if "IMAGE" in hdul else hdul[0].header
                    date_obs = header.get("DATE-OBS", "2025-04-29T03:48:19.430")
                    obs_id = header.get("OBS_ID", header.get("OBSID", f"obs_{idx:02d}"))
                    detector = header.get("DETECTOR", 1)
                    epoch_id = f"epoch_{idx:02d}"

                    self._cached_records[epoch_id] = {
                        "path": fpath,
                        "date": date_obs,
                        "obs_id": obs_id,
                        "detector": detector,
                        "header": dict(header),
                    }
                    local_epochs.append(
                        EpochInfo(
                            epoch_id=epoch_id,
                            date=date_obs,
                            files=[fpath],
                            band_count=102,
                        )
                    )
            except Exception as e:
                logger.warning("Could not read local FITS %s: %s", fpath, e)

        if local_epochs:
            return local_epochs

        # 2. Try live IRSA SIA2 query if no local files exist
        try:
            import pyvo.dal
            service = pyvo.dal.SIA2Service(self.endpoint)
            pos = (reg.ra_center, reg.dec_center, reg.radius_deg)
            res = service.search(pos=pos, collection=self.collection, maxrec=10)

            if len(res) > 0:
                remote_epochs: List[EpochInfo] = []
                for idx, record in enumerate(res, start=1):
                    epoch_id = f"epoch_{idx:02d}"
                    t_min = getattr(record, "t_min", None)
                    date_str = str(t_min) if t_min else f"2025-04-{25 + idx:02d}T00:00:00Z"
                    access_url = str(record.access_url)

                    self._cached_records[epoch_id] = {
                        "url": access_url,
                        "record": record,
                    }
                    remote_epochs.append(
                        EpochInfo(
                            epoch_id=epoch_id,
                            date=date_str,
                            files=[access_url],
                            band_count=102,
                        )
                    )
                return remote_epochs
        except Exception as exc:
            logger.debug("Live IRSA SIA2 query not available: %s", exc)

        # 3. If neither local files nor live query succeeded, raise with documented TODO tags
        raise NotImplementedError(
            "SPHEREx IRSA epoch listing is pending public data release. "
            "TODO(VERIFY): IRSA SIA/TAP table columns and query endpoint."
        )

    def load_epoch(
        self,
        epoch_id: str,
        region: Optional[RegionInfo | Dict[str, Any]] = None,
        fov_deg: float = 0.2,
    ) -> EpochImage:
        """Load real multi-extension FITS cube from local cache or IRSA archive."""
        reg = RegionInfo.from_dict(region) if isinstance(region, dict) else (region or RegionInfo())

        # Ensure epoch info is populated
        if epoch_id not in self._cached_records:
            try:
                self.list_epochs(region=reg, fov_deg=fov_deg)
            except NotImplementedError:
                pass

        if epoch_id not in self._cached_records:
            raise NotImplementedError(
                f"Cannot load real SPHEREx epoch '{epoch_id}'. "
                "TODO(VERIFY): SPHEREx public release FITS extensions, WCS keywords, and wavelength calibration."
            )

        info = self._cached_records[epoch_id]
        fpath = info.get("path")

        # Download if URL only
        if not fpath and "url" in info:
            url = info["url"]
            local_name = Path(url.split("?")[0]).name or f"{epoch_id}.fits"
            target_path = self.data_dir / local_name
            if not target_path.is_file():
                logger.info("Downloading real SPHEREx FITS from %s to %s", url, target_path)
                urllib.request.urlretrieve(url, str(target_path))
            fpath = str(target_path)
            info["path"] = fpath

        if not fpath or not Path(fpath).is_file():
            raise NotImplementedError(
                f"Cannot load real SPHEREx epoch '{epoch_id}'. "
                "TODO(VERIFY): SPHEREx public release FITS extensions, WCS keywords, and wavelength calibration."
            )

        # Read Multi-Extension FITS file
        with fits.open(fpath) as hdul:
            # 1. Calibrated sky image pixels
            if "IMAGE" in hdul:
                img_data = hdul["IMAGE"].data.astype(np.float32)
                img_header = hdul["IMAGE"].header
            else:
                img_data = hdul[0].data.astype(np.float32)
                img_header = hdul[0].header

            # Clean any NaNs or Infs
            img_data = np.nan_to_num(img_data, nan=0.0, posinf=0.0, neginf=0.0)

            # 2. WCS Astrometry
            wcs = WCS(img_header)

            # 3. Variance map
            if "VARIANCE" in hdul and hdul["VARIANCE"].data is not None:
                var_data = np.nan_to_num(hdul["VARIANCE"].data.astype(np.float32), nan=1.0)
            else:
                # Estimate robust empirical background variance
                med = np.median(img_data)
                mad = np.median(np.abs(img_data - med))
                sigma = 1.4826 * mad if mad > 0 else 1.0
                var_data = np.full_like(img_data, sigma ** 2, dtype=np.float32)

            # 4. Bad-pixel / saturation / cosmic-ray mask
            if "FLAGS" in hdul and hdul["FLAGS"].data is not None:
                mask_data = (hdul["FLAGS"].data != 0).astype(np.uint8)
            else:
                mask_data = np.zeros_like(img_data, dtype=np.uint8)

            # 5. Per-pixel wavelength map across Linear Variable Filter (LVF)
            ny, nx = img_data.shape
            if "WCS-WAVE" in hdul and hdul["WCS-WAVE"].data is not None:
                wave_data = hdul["WCS-WAVE"].data
                x_coords = wave_data["X"][0]
                y_coords = wave_data["Y"][0]
                wave_grid = wave_data["VALUES"][0][:, :, 0]

                interp = RegularGridInterpolator((y_coords, x_coords), wave_grid, method="linear", bounds_error=False, fill_value=None)
                yy, xx = np.mgrid[1:ny+1, 1:nx+1]
                pts = np.column_stack([yy.ravel(), xx.ravel()])
                wavelength_map = interp(pts).reshape((ny, nx)).astype(np.float32)
            else:
                # Fallback to linear dispersion across detector Y
                wmin = float(img_header.get("WAVELMIN", 0.75))
                wmax = float(img_header.get("WAVELMAX", 5.00))
                disp = np.linspace(wmin, wmax, ny, dtype=np.float32)[:, np.newaxis]
                wavelength_map = np.repeat(disp, nx, axis=1)

            # 6. Spatial Cutout if requested FOV is smaller than the full detector field
            # SPHEREx detector is ~3.5 deg x 3.5 deg (2040 x 2040, ~6.2 arcsec/pixel)
            pix_scale_deg = abs(img_header.get("CD1_1", img_header.get("CDELT1", -6.2 / 3600.0)))
            target_npix = int(round(fov_deg / pix_scale_deg))

            if target_npix < min(ny, nx) and target_npix >= 32:
                try:
                    center_coord = SkyCoord(ra=reg.ra_center * u.deg, dec=reg.dec_center * u.deg)
                    cut_img = Cutout2D(img_data, position=center_coord, size=(target_npix, target_npix), wcs=wcs, mode="partial", fill_value=0.0)
                    cut_var = Cutout2D(var_data, position=center_coord, size=(target_npix, target_npix), wcs=wcs, mode="partial", fill_value=1.0)
                    cut_mask = Cutout2D(mask_data, position=center_coord, size=(target_npix, target_npix), wcs=wcs, mode="partial", fill_value=1)
                    cut_wave = Cutout2D(wavelength_map, position=center_coord, size=(target_npix, target_npix), wcs=wcs, mode="partial", fill_value=float(np.median(wavelength_map)))

                    img_data = cut_img.data
                    var_data = cut_var.data
                    mask_data = cut_mask.data
                    wavelength_map = cut_wave.data
                    wcs = cut_img.wcs
                except Exception as cut_err:
                    logger.debug("Spatial cutout fallback: %s", cut_err)

            metadata = {
                "source": "irsa_dr1",
                "obs_id": img_header.get("OBS_ID", img_header.get("OBSID", "UNKNOWN")),
                "date_obs": img_header.get("DATE-OBS", "2025-04-29T03:48:19.430"),
                "mjd_obs": float(img_header.get("MJD-OBS", 60794.158558)),
                "detector": int(img_header.get("DETECTOR", 2)),
                "exptime": float(img_header.get("EXPTIME", 112.5)),
                "bunit": str(img_header.get("BUNIT", "MJy/sr")),
                "fpath": fpath,
            }

            return EpochImage(
                pixels=img_data,
                variance=var_data,
                mask=mask_data,
                wcs=wcs,
                wavelength_map=wavelength_map,
                metadata=metadata,
            )


def query_irsa_cutouts(
    ra: float,
    dec: float,
    size_deg: float = 0.2,
    service_url: Optional[str] = None,
) -> Optional[Any]:
    """Guarded query helper for IRSA Simple Image Access (SIA2) cutouts."""
    try:
        import pyvo.dal
    except ImportError:
        logger.warning("pyvo is not installed; IRSA SIA query disabled.")
        return None

    endpoint = service_url or IRSA_SIA2_ENDPOINT
    try:
        service = pyvo.dal.SIA2Service(endpoint)
        pos = (ra, dec, size_deg)
        results = service.search(pos=pos, collection=DEFAULT_COLLECTION)
        return results
    except Exception as exc:
        logger.warning("IRSA SIA query failed: %s", exc)
        return None
