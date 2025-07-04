# Truck Utilization Calculator: User Stories & Assumptions

This document defines the user stories, acceptance criteria, and key assumptions that guide development of the Truck Utilization Calculator.

---

## User Stories & Acceptance Criteria

The primary user persona for these stories is the **Logistics Coordinator**.

### Story 1: Data Entry for Calculation
- **As a Logistics Coordinator, I want to input a list of SKUs and their quantities, select a destination, and choose a truck type so that I can prepare the system for a new calculation.**
  - **Acceptance Criteria:**
    - The UI provides a form for data entry.
    - The user can add multiple SKU entries, each with a quantity field.
    - The user can select a destination from a predefined list (e.g., "Jeddah", "Dammam").
    - The user can choose a truck type from a dropdown menu of predefined options (e.g., "Standard 40ft", "Refrigerated 20ft").
    - A "Calculate" button exists to submit the form.
    - Basic validation prevents submitting the form with no SKUs or zero quantities.

### Story 2: Truck Requirement Calculation
- **As a Logistics Coordinator, I want the system to calculate the total number of trucks required based on my input so that I can plan my fleet allocation.**
  - **Acceptance Criteria:**
    - After clicking "Calculate," the backend API receives the SKU list, quantities, and truck type.
    - The backend calculates the total volume and weight of all SKUs.
    - The backend determines the minimum number of trucks needed to carry the load, considering both the truck's volume and weight capacity.
    - The frontend clearly displays the calculated number of trucks (e.g., "2 Trucks Needed").
    - If the calculation results in a non-integer value (e.g., 1.6), the system displays it to indicate that the final truck is not fully utilized.

### Story 3: Load Visualization
- **As a Logistics Coordinator, I want to see a visual representation of how the SKUs are packed into the trucks so that I can understand the space utilization at a glance.**
  - **Acceptance Criteria:**
    - The UI displays 3D visualization for each required truck.
    - Each type of SKU has its own color in the visualization.
    - Next to the visual, each SKU name is shown with the same color used in the truck view so users can easily tell which is which.
    - The visualization shows how much of the truck is full and how much space is still empty.
    - Visualization should update automatically after each calculation or change.

### Story 4: Optimization Recommendations
- **As a Logistics Coordinator, I want to receive recommendations for additional SKUs to add if a truck is not fully utilized so that I can maximize shipping efficiency.**
  - **Acceptance Criteria:**
    - If the last truck's utilization (by volume or weight) is below 100%, the system calculates the remaining capacity.
    - The UI displays a list of suggested SKUs that could fit into the remaining space.
    - Each recommendation includes the SKU name and the maximum quantity that would fit into the remaining space without exceeding volume or weight constraints.
    - The user can accept or reject each recommendation.
    - Accepted SKUs are added to the calculation and trigger updates to utilization, truck count, and visualization.
    - Rejected SKUs are removed from the recommendation list without affecting the current calculation.

### Story 5: Under-Utilization Alerts
- **As a Logistics Coordinator, I want to be alerted when a calculated load is significantly under-utilized so that I can reconsider the shipment plan to save costs.**
  - **Acceptance Criteria:**
    - The system uses a configurable utilization threshold (default: 70%) to detect underused trucks.
    - If utilization falls below the threshold, the system displays a clear warning message.
    - The warning message should be distinct and easily noticeable (e.g., a yellow or red banner).

### Story 6: Viewing Past Calculations
- **As a Logistics Coordinator, I want to view a history of my previous calculations so that I can reference past shipments and decisions.**
  - **Acceptance Criteria:**
    - All calculations are saved to the database.
    - A "History" page or section in the UI lists previous calculations.
    - Each entry in the history shows key information: date, destination, SKUs, and the number of trucks used.
    - Clicking on a history item could optionally reload the details and visualization of that calculation.
    - The user can cancel/edit calculations that are still in "Planned" status.
    - Users can manually toggle the status of a calculation between Planned and Shipped.

### Story 7: Managing Ongoing Shipments
- **As a Logistics Coordinator, when I start a new calculation for a destination that already has a planned shipment, I want the system to ask if I want to combine them so that I can easily manage and update a single shipment.**
  - **Acceptance Criteria:**
    - When a destination is selected, the system checks for existing calculations with a "Planned" status for the same destination.
    - If a planned calculation exists, the UI prompts the user with two options: "Complete as New Calculation" or "Add to Existing Plan."
    - Choosing "Add to Existing Plan" loads the current input into the previous calculation, allowing the user to continue editing and updating the previous shipment plan.
    - The system merges the SKUs from the current session into the existing plan, preserving any previously entered data.
    - Choosing "Complete as New Calculation" starts a separate session that does not affect any existing plans.

---

## Assumptions & Domain Modeling

The following assumptions define the foundation for system behavior, data structure, and business logic in the Truck Utilization Calculator:

1.  **SKU Properties:**
    - We will start with a predefined, static list of available SKUs.
    - Every SKU is a rigid, rectangular box with fixed `length`, `width`, `height`, and `weight`.
    - SKUs are stackable in any order.

2.  **Truck Properties:**
    - We will have a predefined list of truck types.
    - Every  truck types has `length`, `width`, `height`, and a maximum `weight` capacity.

3.  **Calculation Logic:**
    - The primary calculation will be based on **total volume and total weight**. We will calculate if the total SKU volume fits within the truck's volume and the total weight is within its weight limit.


4.  **Business Logic:**
    - The under-utilization threshold is a fixed percentage (70%) for now.
    - SKU recommendations for leftover space will be based on filling the remaining volume, suggesting items from the SKU list. 