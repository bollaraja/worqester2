import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { BookOpen, Pin, Plus, Trash2, Tag, Search, Pencil } from "lucide-react";
import { NoteItem } from "../types";
import { EditNoteModal } from "../components/modals/EditModals";

export const NotesView: React.FC = () => {
  const { notes, createNote, updateNote, deleteItem } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("Executive");
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  const filteredNotes = notes.filter((n) => {
    const title = n.title || "";
    const content = n.content || "";
    const tags = Array.isArray(n.tags) ? n.tags : [];
    const search = searchTerm.trim().toLowerCase();

    return (
      !search ||
      title.toLowerCase().includes(search) ||
      content.toLowerCase().includes(search) ||
      tags.some((t) => typeof t === "string" && t.toLowerCase().includes(search))
    );
  });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createNote({
      title: newTitle,
      content: newContent,
      tags: [newTag],
      pinned: false,
    });
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Notes & Minutes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scratchpad for leadership strategy, client negotiations, and sprint syncs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>{isAdding ? "Close Editor" : "New Note"}</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSaveNote}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/40 space-y-3 text-xs max-w-2xl shadow-xl"
        >
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Create New Note</h4>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title / meeting subject..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <textarea
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Record discussion points, key decisions, follow-ups..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center justify-between pt-2">
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Executive">Executive</option>
              <option value="Strategy">Strategy</option>
              <option value="Client">Client</option>
              <option value="Internal">Internal</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900/90 border transition-all text-xs space-y-3 flex flex-col justify-between ${
              note.pinned
                ? "border-amber-500/50 shadow-md shadow-amber-500/5"
                : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4
                  onClick={() => setEditingNote(note)}
                  className="font-bold text-slate-900 dark:text-white text-sm tracking-tight hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                >
                  {note.title}
                </h4>
                {note.pinned && <Pin size={14} className="text-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                {note.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px]">{note.updatedAt}</span>
                <button
                  type="button"
                  onClick={() => setEditingNote(note)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Edit note"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem("note", note.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingNote && (
        <EditNoteModal
          note={editingNote}
          isOpen={true}
          onClose={() => setEditingNote(null)}
          onSave={(updated) => {
            updateNote(editingNote.id, updated);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
};
