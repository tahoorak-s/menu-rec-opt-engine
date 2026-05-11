import { useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Select from "react-select";
import "./App.css";

const COLORS = ["#1f7a68", "#e15840", "#f4b942", "#5b6ee1"];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [item, setItem] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState(
    JSON.parse(localStorage.getItem("categories")) || null
  );
  const [loading, setLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [regRole, setRegRole] = useState("waiter");
  const [pending, setPending] = useState([]);

  const register = async () => {
    if (!username || !password) {
      alert("Enter all fields");
      return;
    }

    try {
      await axios.post(`${API_URL}/register`, null, {
        params: { username, password, role: regRole },
      });

      alert("Registered successfully!");
      setIsRegister(false);
      setUsername("");
      setPassword("");
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    }
  };

  const login = async () => {
    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, null, {
        params: { username, password },
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      setRole(res.data.role);
    } catch (err) {
      alert(err.response?.data?.detail || "Invalid login");
    }
  };

  const logout = () => {
    localStorage.clear();
    setRole(null);
    setUsername("");
    setPassword("");
    setItem("");
    setIsMenuOpen(false);
    setResult(null);
    setPending([]);
  };

  const build = async () => {
    if (!file1) {
      alert("Upload a transactions workbook first");
      return;
    }

    const formData = new FormData();
    formData.append("transactions", file1);
    if (file2) {
      formData.append("items", file2);
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/build`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(res.data.categories);
      localStorage.setItem("categories", JSON.stringify(res.data.categories));
      alert("Models Built!");
    } catch (err) {
      alert(err.response?.data?.detail || "Error building models");
    } finally {
      setLoading(false);
    }
  };

  const recommend = async () => {
    if (!item) {
      alert("Select an item");
      return;
    }

    try {
      setIsMenuOpen(false);
      setRecommendLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/recommend?item=${encodeURIComponent(item)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Error getting recommendations");
    } finally {
      setRecommendLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/pending-waiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPending(res.data.pending);
    } catch {
      alert("Error fetching waiters");
    }
  };

  const approve = async (username) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/approve-waiter`, null, {
        params: { username },
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPending();
    } catch {
      alert("Error approving waiter");
    }
  };

  const quadrantData = categories
    ? Object.entries(categories).map(([key, value]) => ({
        name: key,
        value: value.length,
      }))
    : [];

  const menuOptions = categories
    ? Object.entries(categories).flatMap(([quadrant, items]) =>
        items.map((menuItem) => ({
          value: menuItem,
          label: menuItem,
          quadrant,
        }))
      )
    : [];

  const selectedOption = menuOptions.find((option) => option.value === item) || null;

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 56,
      borderRadius: 16,
      borderColor: state.isFocused ? "#1f7a68" : "rgba(22, 35, 46, 0.12)",
      background: "rgba(255, 255, 255, 0.86)",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(31, 122, 104, 0.14)" : "none",
      padding: "2px 6px",
      transition: "all 180ms ease",
      cursor: "pointer",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 20px 50px rgba(22, 35, 46, 0.16)",
      zIndex: 30,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 30,
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused ? "rgba(31, 122, 104, 0.1)" : "white",
      color: "#16232e",
      padding: "12px 14px",
      cursor: "pointer",
    }),
  };

  if (!role) {
    return (
      <main className="app-shell auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <section className="auth-card animate-in">
          <div className="brand-mark">M</div>
          <p className="eyebrow">Restaurant intelligence</p>
          <h1>MenuMind</h1>
          <p className="lede">
            Build smarter menu decisions from sales data and serve better item
            pairings in seconds.
          </p>

          <div className="auth-form">
            <input
              className="text-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="text-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {isRegister && (
              <select
                className="text-input"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="waiter">Waiter</option>
                <option value="admin">Admin</option>
              </select>
            )}

            <button className="primary-button full-width" onClick={isRegister ? register : login}>
              {isRegister ? "Create account" : "Sign in"}
            </button>
          </div>

          <button className="link-button" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have an account? Sign in" : "New user? Create an account"}
          </button>
        </section>
      </main>
    );
  }

  if (role === "admin") {
    return (
      <main className="app-shell dashboard-shell">
        <header className="topbar animate-in">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Restaurant Intelligence</h1>
            <p className="muted">Upload datasets, build models, and track menu performance.</p>
          </div>
          <button className="ghost-button" onClick={logout}>Logout</button>
        </header>

        <section className="panel upload-panel animate-in delay-1">
          <div>
            <p className="eyebrow">Model builder</p>
            <h2>Upload datasets</h2>
            <p className="muted">Add transactions and item data to refresh recommendations.</p>
          </div>

          <div className="upload-grid">
            <label className="file-tile">
              <span>Transactions file</span>
              <strong>{file1?.name || "Choose Excel workbook"}</strong>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile1(e.target.files[0])} />
            </label>
            <label className="file-tile">
              <span>Items file</span>
              <strong>{file2?.name || "Optional separate file"}</strong>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile2(e.target.files[0])} />
            </label>
          </div>

          <button className="primary-button" onClick={build} disabled={loading}>
            {loading ? "Building models..." : "Build models"}
          </button>
        </section>

        {categories && (
          <section className="metric-grid animate-in delay-2">
            {Object.entries(categories).map(([quadrant, items], index) => (
              <article className="metric-card" key={quadrant}>
                <span style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <p>{quadrant}</p>
                <strong>{items.length}</strong>
              </article>
            ))}
          </section>
        )}

        {categories && (
          <section className="analytics-grid animate-in delay-3">
            <article className="panel chart-panel">
              <div>
                <p className="eyebrow">Analytics</p>
                <h2>Menu quadrant split</h2>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={quadrantData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={112}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {quadrantData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </article>

            <div className="quadrant-grid">
              {Object.entries(categories).map(([quadrant, items], index) => (
                <article className="panel quadrant-card" key={quadrant}>
                  <div className="quadrant-heading">
                    <span style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <h2>{quadrant}</h2>
                  </div>
                  <details>
                    <summary>View items ({items.length})</summary>
                    <div className="item-list">
                      {items.map((menuItem, idx) => (
                        <p key={`${menuItem}-${idx}`}>{menuItem}</p>
                      ))}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="panel waiter-panel animate-in delay-4">
          <div>
            <p className="eyebrow">Team access</p>
            <h2>Pending waiters</h2>
          </div>
          <button className="secondary-button" onClick={fetchPending}>Load waiters</button>

          <div className="pending-list">
            {pending.length === 0 && <p className="muted">No pending waiters loaded yet.</p>}
            {pending.map((waiter) => (
              <div className="pending-row" key={waiter}>
                <span>{waiter}</span>
                <button className="mini-button" onClick={() => approve(waiter)}>Approve</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (role === "waiter") {
    return (
      <main className="app-shell dashboard-shell waiter-shell">
        <header className="topbar animate-in">
          <div>
            <p className="eyebrow">Service assistant</p>
            <h1>Waiter Assistant</h1>
            <p className="muted">Search a menu item and get smart pairings for the table.</p>
          </div>
          <button className="ghost-button" onClick={logout}>Logout</button>
        </header>

        {!categories && (
          <section className="panel notice animate-in delay-1">
            Admin must build models first.
          </section>
        )}

        <section className="panel recommend-panel animate-in delay-1">
          <div>
            <p className="eyebrow">Recommendation lookup</p>
            <h2>Search menu item</h2>
          </div>

          <Select
            className="menu-select"
            classNamePrefix="menu-select"
            options={menuOptions}
            value={selectedOption}
            onChange={(selected) => {
              setItem(selected?.value || "");
              setResult(null);
              setIsMenuOpen(false);
            }}
            onMenuOpen={() => setIsMenuOpen(true)}
            onMenuClose={() => setIsMenuOpen(false)}
            menuIsOpen={isMenuOpen}
            menuPortalTarget={document.body}
            menuPlacement="auto"
            maxMenuHeight={220}
            placeholder="Search and select item..."
            isSearchable
            styles={selectStyles}
          />

          <button className="primary-button" onClick={recommend} disabled={recommendLoading || !item}>
            {recommendLoading ? "Finding pairings..." : "Generate recommendations"}
          </button>
        </section>

        {result && (
          <section className="results-wrap animate-in delay-2">
            <div>
              <p className="eyebrow">Suggested pairings</p>
              <h2>Recommendations</h2>
            </div>

            <div className="recommendation-list">
              {result.recommendations.map((recommendation, index) => (
                <article className="recommendation-card" key={`${recommendation}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{recommendation}</p>
                </article>
              ))}
            </div>

            <p className="reason-pill">{result.reason}</p>
          </section>
        )}
      </main>
    );
  }
}

export default App;
