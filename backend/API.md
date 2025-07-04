# Truck Utilization Calculator Backend API Documentation

This document provides an overview of the API endpoints for the Truck Utilization Calculator backend.

## Base URL

All API endpoints are prefixed with `/api`.

For example, if your backend is running locally on port `5000`, the base URL would be `http://localhost:5000/api`.

## Endpoints

### 1. Get All SKUs

Retrieves a list of all available Stock Keeping Units (SKUs) with their dimensions and weight.

- **URL:** `/api/skus`
- **Method:** `GET`
- **Description:** Returns an array of SKU objects.
- **Response (Success 200 OK):**
  ```json
  [
    {
      "_id": "60d5ec49c6d3a9001c8c9a3b",
      "name": "Small Box",
      "length": 0.5,
      "width": 0.5,
      "height": 0.5,
      "weight": 1,
      "createdAt": "2023-10-26T10:00:00.000Z",
      "updatedAt": "2023-10-26T10:00:00.000Z"
    },
    {
      "_id": "60d5ec49c6d3a9001c8c9a3c",
      "name": "Medium Box",
      "length": 1,
      "width": 1,
      "height": 1,
      "weight": 5,
      "createdAt": "2023-10-26T10:01:00.000Z",
      "updatedAt": "2023-10-26T10:01:00.000Z"
    }
  ]
  ```

### 2. Get All Truck Types

Retrieves a list of all available truck types with their dimensions and weight capacity.

- **URL:** `/api/trucks`
- **Method:** `GET`
- **Description:** Returns an array of TruckType objects.
- **Response (Success 200 OK):**
  ```json
  [
    {
      "_id": "60d5ec49c6d3a9001c8c9a3d",
      "name": "Standard 40ft",
      "length": 12.19,
      "width": 2.43,
      "height": 2.59,
      "weightCapacity": 27000,
      "createdAt": "2023-10-26T10:02:00.000Z",
      "updatedAt": "2023-10-26T10:02:00.000Z"
    },
    {
      "_id": "60d5ec49c6d3a9001c8c9a3e",
      "name": "Refrigerated 20ft",
      "length": 6.06,
      "width": 2.28,
      "height": 2.26,
      "weightCapacity": 10000,
      "createdAt": "2023-10-26T10:03:00.000Z",
      "updatedAt": "2023-10-26T10:03:00.000Z"
    }
  ]
  ```

### 3. Create a New Calculation

Calculates the required number of trucks, total volume, total weight, and utilization based on provided SKUs and truck type. Also provides optimization recommendations and under-utilization alerts.

- **URL:** `/api/calculations`
- **Method:** `POST`
- **Description:** Initiates a new truck utilization calculation and saves it to the database.
- **Request Body:**
  ```json
  {
    "destination": "Jeddah",
    "skuQuantities": [
      { "skuId": "<SKU_ID_1>", "quantity": 10 },
      { "skuId": "<SKU_ID_2>", "quantity": 5 }
    ],
    "truckTypeId": "<TRUCK_TYPE_ID>"
  }
  ```
- **Response (Success 201 Created):**
  ```json
  {
    "calculation": {
      "_id": "60d5ec49c6d3a9001c8c9a3f",
      "destination": "Jeddah",
      "skus": [
        { "sku": "<SKU_ID_1>", "quantity": 10, "_id": "60d5ec49c6d3a9001c8c9a40" },
        { "sku": "<SKU_ID_2>", "quantity": 5, "_id": "60d5ec49c6d3a9001c8c9a41" }
      ],
      "truckType": "<TRUCK_TYPE_ID>",
      "calculatedTrucks": 2,
      "totalVolume": 150,
      "totalWeight": 75,
      "utilization": 75.50,
      "status": "Planned",
      "createdAt": "2023-10-26T10:04:00.000Z",
      "updatedAt": "2023-10-26T10:04:00.000Z",
      "__v": 0
    },
    "recommendations": [
      { "sku": { /* SKU Object */ }, "maxQuantity": 3 }
    ],
    "isUnderUtilized": false
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  { "message": "Missing required fields." }
  ```
- **Error Response (500 Internal Server Error):**
  ```json
  { "message": "Error message details" }
  ```

### 4. Get All Calculations History

Retrieves a history of all previously saved calculations.

- **URL:** `/api/calculations`
- **Method:** `GET`
- **Description:** Returns an array of Calculation objects, with SKU and TruckType details populated.
- **Response (Success 200 OK):**
  ```json
  [
    {
      "_id": "60d5ec49c6d3a9001c8c9a3f",
      "destination": "Jeddah",
      "skus": [
        { "_id": "<SKU_ID_1>", "name": "Small Box", /* ...other SKU fields */, "quantity": 10 },
        { "_id": "<SKU_ID_2>", "name": "Medium Box", /* ...other SKU fields */, "quantity": 5 }
      ],
      "truckType": { "_id": "<TRUCK_TYPE_ID>", "name": "Standard 40ft", /* ...other TruckType fields */ },
      "calculatedTrucks": 2,
      "totalVolume": 150,
      "totalWeight": 75,
      "utilization": 75.50,
      "status": "Planned",
      "createdAt": "2023-10-26T10:04:00.000Z",
      "updatedAt": "2023-10-26T10:04:00.000Z"
    }
  ]
  ```

### 5. Manage Shipment (Check for Existing Planned Shipment)

Checks if a planned shipment already exists for a given destination.

- **URL:** `/api/calculations/manage`
- **Method:** `POST`
- **Description:** Determines if there's an ongoing (planned) shipment for the specified destination.
- **Request Body:**
  ```json
  {
    "destination": "Jeddah"
  }
  ```
- **Response (Success 200 OK - Planned Shipment Exists):**
  ```json
  {
    "message": "A planned shipment already exists for this destination.",
    "existingCalculation": {
      "_id": "60d5ec49c6d3a9001c8c9a3f",
      "destination": "Jeddah",
      "status": "Planned"
      // ... other relevant calculation fields
    },
    "actionRequired": true
  }
  ```
- **Response (Success 200 OK - No Planned Shipment):**
  ```json
  {
    "message": "No planned shipment found for this destination. Proceed with new calculation.",
    "actionRequired": false
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  { "message": "Destination is required." }
  ```
- **Error Response (500 Internal Server Error):**
  ```json
  { "message": "Error message details" }
  ```

### 6. Update an Existing Calculation

Updates an existing calculation by its ID. This can be used to change the status or to re-calculate if SKU quantities or truck types are adjusted.

- **URL:** `/api/calculations/:id`
- **Method:** `PUT`
- **Description:** Modifies an existing calculation. Can update destination, status, or trigger a recalculation by providing `skuQuantities` and `truckTypeId`.
- **URL Parameters:**
  - `id` (string, required): The unique identifier of the calculation to update.
- **Request Body (Example 1: Update Status):**
  ```json
  {
    "status": "Shipped"
  }
  ```
- **Request Body (Example 2: Recalculate and Update SKUs/TruckType):**
  ```json
  {
    "skuQuantities": [
      { "skuId": "<NEW_SKU_ID_1>", "quantity": 15 }
    ],
    "truckTypeId": "<NEW_TRUCK_TYPE_ID>"
  }
  ```
- **Response (Success 200 OK):**
  ```json
  {
    "_id": "60d5ec49c6d3a9001c8c9a3f",
    "destination": "New Jeddah",
    "skus": [ /* ... updated SKU array */ ],
    "truckType": "<UPDATED_TRUCK_TYPE_ID>",
    "calculatedTrucks": 3,
    "totalVolume": 200,
    "totalWeight": 100,
    "utilization": 80.00,
    "status": "Shipped",
    "createdAt": "2023-10-26T10:04:00.000Z",
    "updatedAt": "2023-10-26T10:05:00.000Z",
    "__v": 0
  }
  ```
- **Error Response (404 Not Found):**
  ```json
  { "message": "Calculation not found." }
  ```
- **Error Response (500 Internal Server Error):**
  ```json
  { "message": "Error message details" }
  ``` 