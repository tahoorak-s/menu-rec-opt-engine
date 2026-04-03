# menu-rec-opt-engine
A web application that helps restaurants redesign and optimize their menus, while equipping servers with an intelligent recommendation engine to confidently suggest items to enhance sales without overwhelming customers with unfamiliar choices.

A full-stack intelligent restaurant management system that uses **machine learning** and **market basket analysis**  to provide menu insights and smart recommendations.

---

## Features

### Authentication & Authorization

* User registration (Admin / Waiter)
* JWT-based login system
* Role-based access control
* Admin approval system for waiters

---

### Admin Capabilities

* Upload transaction & item datasets
* Automatically perform **Menu Engineering Analysis**
* Classify items into:

  * Star
  * Plowhorse
  * Puzzle
  * Dog
* View categorized menu insights
* Approve pending waiter accounts
* Build ML models for recommendations

---

### Waiter Capabilities

* Login after admin approval
* Get intelligent item recommendations
* View reasoning behind recommendations

---

### Machine Learning Features

The system integrates multiple machine learning techniques to analyze restaurant data and generate intelligent insights and recommendations:

* **Automated Menu Engineering** → Uses data-driven calculations to classify menu items into categories (Star, Plowhorse, Puzzle, Dog) without relying on manual Excel formulas, enabling faster and more consistent analysis.
* **Apriori Algorithm** → Performs association rule mining on transaction data to identify frequently purchased item combinations and uncover hidden patterns in customer behavior.
* **Hierarchical Clustering** → First groups menu items based on "departments" or "categories"(such as "starters", "biryani", etc), followed by sub-clusters within each parent cluster based on the menu engineering quadrants (stars, plowhorse..) which is nothing but clustering based on sales performance and the revenue generated.
* **Hybrid Recommendation System** → Combines association rules and clustering results to provide more accurate and context-aware item recommendations.

---

## Tech Stack

### Frontend

* React (Hooks)
* Axios

### Backend

* FastAPI
* JWT Authentication

### Database

* SQLite (via SQLAlchemy)

### Data Processing / ML

* Pandas
* NumPy
* mlxtend (Apriori)

---

## Project Structure

```
backend/
│
├── main.py
├── database.py
├── models.py
├── auth.py
├── apriori_model.py
├── hierarchical_model.py
├── hybrid_model.py
├── menu_eng.py
└── users.db

frontend/
│
└── App.jsx
```

---

## Installation & Setup

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## Default Behavior

* Admin accounts are **auto-approved**
* Waiter accounts require **admin approval**
* Models must be built before recommendations

---

## System Workflow

```text
Register → Login → Role Check → 
Admin: Build Models → Approve Waiters → 
Waiter: Get Recommendations
```

---

## Menu Engineering Logic

Items are classified based on:

* **Quantity Sold (Popularity)**
* **Revenue (Profit proxy)**

| Category     | Meaning                      |
| ------------ | ---------------------------- |
| Star       | High profit, High popularity |
| Plowhorse | Low profit, High popularity  |
| Puzzle    | High profit, Low popularity  |
| Dog       | Low profit, Low popularity   |

---

## Current Limitations

* Passwords stored in plain text (to be improved)
* SQLite used (not optimized for large-scale deployment)
* No UI styling (functional only)

---

## Future Improvements

* Password hashing (bcrypt)
* Dashboard UI (charts, cards)
* Data visualization (pie/bar charts)
* Deployment (Docker / Cloud)
* Multi-admin data isolation

---

