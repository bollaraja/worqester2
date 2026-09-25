import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { FileText, Download, Plus, Search, Tag, Trash2, Folder, ExternalLink, Pencil } from "lucide-react";
import { DocumentItem } from "../types";
import { EditDocumentModal } from "../components/modals/EditModals";

export const DocumentsView: React.FC = () => {
  const { documents, addDocument, updateDocument, deleteItem, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const title = doc.title || doc.name || "";
    const fileName = doc.fileName || doc.name || "";
    const tags = Array.isArray(doc.tags) ? doc.tags : [];
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      title.toLowerCase().includes(search) ||
      fileName.toLowerCase().includes(search) ||
      tags.some((t) => typeof t === "string" && t.toLowerCase().includes(search));

    const matchesTag = selectedTag === "all" || tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(
    new Set(documents.flatMap((d) => (Array.isArray(d.tags) ? d.tags.filter((t) => typeof t === "string") : [])))
  );

  const handleUploadSim = () => {
    const title = prompt("Enter Document Title:", "Q4 Technical Roadmap & Delivery Plan");
    if (!title) return;
    const fileName = `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`;
    addDocument({
      title,
      name: fileName,
      fileName,
      size: "1.8 MB",
      fileSize: "1.8 MB",
      fileType: "pdf",
      uploadedBy: currentUser.name,
      tags: ["Internal", "Strategic"],
      version: "v1.0",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Enterprise Knowledge & Documents
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Centralized repository for contracts, architecture briefs, and policies
          </p>
        </div>

        <button
          type="button"
          onClick={handleUploadSim}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search and Tags Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === "all"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === tag
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const docTitle = doc.title || doc.name || "Untitled Document";
          const docFileName = doc.fileName || doc.name || `${docTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`;
          const docFileSize = doc.fileSize || doc.size || "1.5 MB";
          const docFileType = doc.fileType || (docFileName.includes(".") ? docFileName.split(".").pop() : "pdf") || "pdf";
          const docVersion = doc.version || "v1.0";
          const docTags = Array.isArray(doc.tags) ? doc.tags : [];
          const docUploadedBy = doc.uploadedBy || "Team Member";

          return (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm space-y-3 text-xs group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center font-mono font-bold text-xs uppercase">
                    {docFileType}
                  </div>
                  <div className="min-w-0">
                    <h4
                      onClick={() => setEditingDoc(doc)}
                      className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {docTitle}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {docFileName} • {docFileSize}
                    </span>
                  </div>
                </div>

                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold border border-slate-200 dark:border-slate-700 shrink-0">
                  {docVersion}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {docTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate max-w-[150px]">By {docUploadedBy}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingDoc(doc)}
                    className="p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Document"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([`Worqester Document: ${docTitle}\nVersion: ${docVersion}\nUploaded By: ${docUploadedBy}`], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = docFileName;
                      a.click();
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Download File"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem("document", doc.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingDoc && (
        <EditDocumentModal
          document={editingDoc}
          isOpen={true}
          onClose={() => setEditingDoc(null)}
          onSave={(updated) => {
            updateDocument(editingDoc.id, updated);
            setEditingDoc(null);
          }}
        />
      )}
    </div>
  );
};
