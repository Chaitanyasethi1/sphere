"""Inspect real SPHEREx FITS HDUs, headers, extensions, and wavelength mapping."""
import astropy.io.fits as fits
import urllib.request
import os

url = "https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W18_1B/l2b-v27-2026-196/2/level2_2025W18_1B_0095_1D2_spx_l2b-v27-2026-196.fits"
local_fits = "data/raw/sample_dr1_l2b.fits"
os.makedirs("data/raw", exist_ok=True)

if not os.path.exists(local_fits):
    print(f"Downloading sample FITS from {url}...")
    urllib.request.urlretrieve(url, local_fits)
    print(f"Downloaded {os.path.getsize(local_fits) / 1024 / 1024:.2f} MB")

with fits.open(local_fits) as hdul:
    print(f"\n--- HDU List in {local_fits} ---")
    hdul.info()
    
    print("\n--- Primary Header Keywords ---")
    for k in ['TELESCOP', 'INSTRUME', 'OBS_ID', 'DATE-OBS', 'MJD-OBS', 'EXPTIME', 'BAND', 'CHANNEL']:
        if k in hdul[0].header:
            print(f"  {k} = {hdul[0].header[k]}")
            
    for i, hdu in enumerate(hdul[1:], start=1):
        name = hdu.name
        shape = hdu.data.shape if hdu.data is not None else None
        dtype = hdu.data.dtype if hdu.data is not None else None
        print(f"\n--- Extension {i}: {name} (shape: {shape}, dtype: {dtype}) ---")
        # Print first few header cards
        sample_keys = [k for k in hdu.header.keys() if not k.startswith(('COMMENT', 'HISTORY', ''))][:8]
        for k in sample_keys:
            print(f"  {k} = {hdu.header[k]}")
