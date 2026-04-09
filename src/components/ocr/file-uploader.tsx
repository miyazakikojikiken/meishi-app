'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  label: string
  file: File | null
  onFileChange: (file: File | null) => void
  accept?: string[]
  maxSizeMB?: number
  error?: string
}

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'application/pdf']

export default function FileUploader({
  label,
  file,
  onFileChange,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  error,
}: FileUploaderProps) {
  const maxSize = maxSizeMB * 1024 * 1024

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileChange(accepted[0])
    },
    [onFileChange]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: accept.reduce(
        (acc, type) => ({ ...acc, [type]: [] }),
        {} as Record<string, string[]>
      ),
      multiple: false,
      maxSize,
    })

  const rejection = fileRejections[0]

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {file ? (
        <div className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
          <FileImage size={20} className="text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-400">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
            (error || rejection) && 'border-red-300 bg-red-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="text-sm text-blue-600 font-medium">ここにドロップ</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                クリックまたはドラッグ＆ドロップ
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG / PNG / PDF（最大{maxSizeMB}MB）
              </p>
            </>
          )}
        </div>
      )}

      {rejection && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={12} />
          <span>
            {rejection.errors[0]?.code === 'file-too-large'
              ? `ファイルサイズが${maxSizeMB}MBを超えています`
              : '対応していないファイル形式です'}
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
