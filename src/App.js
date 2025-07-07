import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

// Use your environment variable
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
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks`,
      {
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );
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
    await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/tasks/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
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
            <div>
              <button
                onClick={() =>
                  updateStatus(
                    task._id,
                    task.status === "completed" ? "in progress" : "completed"
                  )
                }
                style={styles.smallButton}
              >
                {task.status === "completed" ? "Mark In Progress" : "Mark Completed"}
              </button>
              <button onClick={() => startEditing(task)} style={styles.smallButton}>
                Edit
              </button>
              <button onClick={() => deleteTask(task._id)} style={styles.deleteButton}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  /* same styles as before */
};

export default App;
