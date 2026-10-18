# Layerforge 3D – React + Node

## Run (two terminals)
    cd server && npm install && ADMIN_PASSWORD=yourpass JWT_SECRET=longrandom npm start    # :5001
    cd client && npm install && npm run dev                                                # http://localhost:5173
Admin: http://localhost:5173/#/admin   (if you upgraded from v1: delete server/data.json first)

## Production
    cd client && npm run build && cd ../server && ADMIN_PASSWORD=... JWT_SECRET=... npm start
Serves site + API from one port. Keep server/data.json and server/uploads/ on a persistent disk and back them up.

## How it works
- STEP files are measured in the visitor's browser (OpenCascade WASM) – nothing is uploaded until they send an inquiry.
- Price = shell + infill volume (wall thickness, infill %, supports) -> weight x material price + print time x machine rate -> markup -> x qty + setup fee.
- All text, services, FAQs, materials and every price number are editable in Admin; inquiries (with attached files) appear there too.
