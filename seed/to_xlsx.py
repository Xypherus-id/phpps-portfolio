"""Turns seed/seed.json (made by dev/export-seed.js from Seed.gs) into seed/PHPPS_Portfolio_Data.xlsx."""
import json
import os

from openpyxl import Workbook

HERE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(HERE, "seed.json")))
wb = Workbook()
wb.remove(wb.active)
for name, cols in data["columns"].items():
    ws = wb.create_sheet(name)
    ws.append(cols)
    for row in data["tables"][name]:
        ws.append(row)
wb.save(os.path.join(HERE, "PHPPS_Portfolio_Data.xlsx"))
print("Wrote seed/PHPPS_Portfolio_Data.xlsx")
