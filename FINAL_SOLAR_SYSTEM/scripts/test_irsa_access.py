"""Test IRSA SIA2 search using pyvo.dal.SIA2Service."""
import pyvo.dal

endpoint = "https://irsa.ipac.caltech.edu/SIA?"
service = pyvo.dal.SIA2Service(endpoint)

for coll in ["spherex_dr1", "spherex_dr1_deep", "spherex_dr1_cube", "spherex_qr3"]:
    print(f"\n--- Testing COLLECTION='{coll}' with SIA2Service ---")
    try:
        # pos can be tuple (ra, dec, radius_deg) or POS expression
        res = service.search(pos=(269.452, 66.561, 0.05), collection=coll, maxrec=5)
        print(f"Success! Found {len(res)} matching records for {coll}.")
        if len(res) > 0:
            rec = res[0]
            print(f"Record 0 access_url: {rec.access_url}")
            for k in ['obs_id', 't_min', 't_max', 'em_min', 'em_max', 's_ra', 's_dec', 'access_format']:
                if k in rec:
                    print(f"  {k}: {rec[k]}")
    except Exception as e:
        print(f"Error querying {coll}: {e}")
