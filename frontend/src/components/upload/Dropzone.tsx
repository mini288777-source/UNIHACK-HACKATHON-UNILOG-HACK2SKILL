import React, { useState, useRef } from 'react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, isUploading }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const fname = file.name.toLowerCase();
    if (!fname.endsWith('.pdf') && !fname.endsWith('.csv') && !fname.endsWith('.xlsx')) {
      setErrorMessage('Supported formats: Catalog CSV (.csv), Excel Workbook (.xlsx), or Technical Specification PDF (.pdf).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the maximum limit of 50MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const isSpreadsheet = selectedFile?.name.toLowerCase().endsWith('.csv') || selectedFile?.name.toLowerCase().endsWith('.xlsx');

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`p-10 border-2 border-dashed rounded-2xl transition-all duration-300 ease-out flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
          dragActive
            ? 'border-secondary-container bg-primary-container/20 shadow-lg scale-[1.01] glow-ring-orange'
            : selectedFile
            ? 'border-secondary-container/60 bg-surface-container-high/60 glow-ring-orange'
            : 'border-outline-variant/50 hover:border-secondary-container/50 bg-surface-container-low/60 hover:bg-surface-container-high/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.pdf,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary-container/20 border border-secondary-container/30 flex items-center justify-center text-secondary-container mb-3 shadow-lg">
              <span className="material-symbols-outlined text-[32px]">
                {isSpreadsheet ? 'table_view' : 'description'}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-label ${
                isSpreadsheet ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {isSpreadsheet ? 'Catalog Dataset Batch' : 'Specification PDF'}
              </span>
              <h4 className="text-base font-bold text-on-surface truncate max-w-md font-headline">{selectedFile.name}</h4>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 font-mono">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Pipeline Ingestion
            </p>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Choose Different File
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="px-5 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(254,170,0,0.3)]"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Enrich into 252-Column Delivery Format</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary-container/20 border border-secondary-container/30 flex items-center justify-center text-secondary-container mb-4 shadow-lg animate-float">
              <span className="material-symbols-outlined text-[36px]">cloud_upload</span>
            </div>
            <h4 className="text-base font-bold text-on-surface mb-1 font-headline">Drag & Drop Catalog Dataset or PDF</h4>
            <p className="text-xs text-on-surface-variant max-w-md mb-4 leading-relaxed font-body">
              Upload raw catalog feeds (<code className="text-secondary-container font-mono">Unihack_ Sample Dataset - Input.csv</code>), Excel workbooks, or PDF technical spec sheets (Up to 50MB)
            </p>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold border border-outline-variant/40 transition-all font-label uppercase tracking-wider">
                Browse Local Files
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
