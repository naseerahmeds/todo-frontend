import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL);

function App() {
  const [token, setToken] = useState("");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get("token");
    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
      fetchTasks(t);
    } else {
      const stored = localStorage.getItem("token");
      if (stored) {
        setToken(stored);
        fetchTasks(stored);
      }
    }
  }, []);

  useEffect(() => {
    socket.on("taskCreated", () => {
      if (token) fetchTasks(token);
    });
    socket.on("taskUpdated", () => {
      if (token) fetchTasks(token);
    });
    socket.on("taskDeleted", () => {
      if (token) fetchTasks(token);
    });
    return () => {
      socket.off("taskCreated");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, [token]);

  const fetchTasks = async (jwt) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setTasks(res.data);
  };

  const addOrUpdateTask = async () => {
    if (!title.trim()) return;
    if (editingTask) {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/tasks/${editingTask._id}`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTask(null);
    } else {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setTitle("");
    fetchTasks(token);
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `${process.env.REACT_APP_API_URL}/api/tasks/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks(token);
  };

  const deleteTask = async (id) => {
    await axios.delete(`${process.env.REACT_APP_API_URL}/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks(token);
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setTitle(task.title);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setTitle("");
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken("");
    window.location.href = "/";
  };

  if (!token) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginHeading}>Welcome to ToDo App</h1>
          <p style={styles.loginText}>Sign in to manage your tasks effortlessly.</p>
          <a
            href={`${process.env.REACT_APP_API_URL}/api/auth/google`}
            style={styles.loginButton}
          >
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.heading}>📝 Your Tasks</h1>
        <button onClick={signOut} style={styles.signOutButton}>
          Sign Out
        </button>
      </div>
      <div style={styles.formRow}>
        <input
          placeholder="Enter task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <button onClick={addOrUpdateTask} style={styles.primaryButton}>
          {editingTask ? "Update Task" : "Add Task"}
        </button>
        {editingTask && (
          <button onClick={cancelEditing} style={styles.cancelButton}>
            Cancel
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p style={styles.noTasks}>No tasks yet. Add your first task!</p>
      ) : (
        <ul style={styles.taskList}>
          {tasks.map((task) => (
            <li key={task._id} style={styles.taskItem}>
              <div>
                <strong>{task.title}</strong>
                <br />
                <small>Status: {task.status}</small>
                <br />
                <small>
                  Added on: {new Date(task.createdAt).toLocaleDateString()}
                </small>
              </div>
              <div style={styles.taskActions}>
                <button
                  onClick={() =>
                    updateStatus(
                      task._id,
                      task.status === "completed" ? "in progress" : "completed"
                    )
                  }
                  style={styles.statusButton}
                >
                  {task.status === "completed" ? "Mark In Progress" : "Mark Completed"}
                </button>
                <button
                  onClick={() => startEditing(task)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(task._id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "650px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#fdfdfd",
    borderRadius: "8px",
    boxShadow: "0 0 20px rgba(0,0,0,0.05)",
  },
  heading: {
    color: "#2c3e50",
    margin: 0,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  formRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "25px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "15px",
  },
  primaryButton: {
    padding: "10px 16px",
    backgroundColor: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  cancelButton: {
    padding: "10px 16px",
    backgroundColor: "#7f8c8d",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  signOutButton: {
    padding: "8px 14px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  noTasks: {
    textAlign: "center",
    color: "#888",
    marginTop: "20px",
  },
  taskList: {
    listStyle: "none",
    padding: 0,
  },
  taskItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f9fa",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "12px",
    border: "1px solid #eee",
  },
  taskActions: {
    display: "flex",
    gap: "6px",
  },
  statusButton: {
    padding: "6px 10px",
    fontSize: "13px",
    backgroundColor: "#2980b9",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  editButton: {
    padding: "6px 10px",
    fontSize: "13px",
    backgroundColor: "#8e44ad",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "6px 10px",
    fontSize: "13px",
    backgroundColor: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#ecf0f1",
  },
  loginBox: {
    padding: "50px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 0 15px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  loginHeading: {
    marginBottom: "10px",
    color: "#34495e",
  },
  loginText: {
    marginBottom: "20px",
    color: "#555",
  },
  loginButton: {
    padding: "12px 24px",
    backgroundColor: "#4285F4",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "15px",
  },
};

export default App;
