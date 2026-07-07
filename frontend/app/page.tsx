"use client";

import { useEffect, useState } from "react";

type Note = {
  id: number;
  text: string;
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");

  async function loadNotes() {
    const response = await fetch("http://localhost:8000/api/notes");
    const data = await response.json();
    setNotes(data);
  }

  async function addNote() {
    if (!text.trim()) return;

    await fetch("http://localhost:8000/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    setText("");
    loadNotes();
  }

  useEffect(() => {
    async function fetchNotes() {
      const response = await fetch("http://localhost:8000/api/notes");
      const data = await response.json();
      setNotes(data);
    }

    fetchNotes();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-gray-900 p-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">FlowMind Test App</h1>

        <p className="text-gray-300 mb-6">
          Frontend + Backend + PostgreSQL test
        </p>

        <div className="flex gap-3 mb-6">
          <input
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 outline-none"
            placeholder="Enter a test note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            onClick={addNote}
            className="rounded-lg bg-white text-gray-950 px-5 py-3 font-semibold"
          >
            Add
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-3">Saved Notes</h2>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-gray-400">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-lg bg-gray-800 p-4">
                {note.text}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}