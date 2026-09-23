import importlib.util
import io
import pathlib
import unittest
import zipfile


MODULE_PATH = pathlib.Path(__file__).with_name("update-overlays.py")
SPEC = importlib.util.spec_from_file_location("update_overlays", MODULE_PATH)
OVERLAYS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(OVERLAYS)


class OverlayUpdaterTests(unittest.TestCase):
    def test_uacontrol_preserves_contact_line_and_ignores_units(self):
        kml = f'''<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>
          <Folder><name>Frontline</name><Placemark><name>Frontline</name><description>Estimated line</description><LineString><coordinates>35,48 36,49</coordinates></LineString></Placemark></Folder>
          <Folder><name>Ukrainian Unit Positions</name><Placemark><name>Test Brigade</name><ExtendedData><Data name="Military Unit Number"><value>A1234</value></Data><Data name="Last Known Location"><value>https://example.test/evidence Place 17/08/26</value></Data></ExtendedData><Point><coordinates>35.246,48.754</coordinates></Point></Placemark></Folder>
        </Document></kml>'''
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            archive.writestr("doc.kml", kml)
        frontlines = OVERLAYS.parse_uacontrol_kmz(buffer.getvalue(), "2026-09-23T00:00:00Z")
        self.assertEqual(len(frontlines["features"]), 1)
        self.assertEqual(frontlines["features"][0]["geometry"]["coordinates"], [[35, 48], [36, 49]])

if __name__ == "__main__":
    unittest.main()
