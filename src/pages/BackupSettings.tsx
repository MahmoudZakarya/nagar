import { useState, useEffect } from 'react';
import { Cloud, CloudUpload, Download, RefreshCw, FileCheck, AlertCircle, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../config/api';

interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
}

interface BackupStatus {
  configured: boolean;
  lastBackup: BackupInfo | null;
  message?: string;
}

// GCS Configuration Form Component
interface GCSConfigurationFormProps {
  onConfigured: () => void;
}

const GCSConfigurationForm: React.FC<GCSConfigurationFormProps> = ({ onConfigured }) => {
  const [bucketName, setBucketName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(false);

  const handleKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.json')) {
        toast.error('يجب أن يكون الملف بصيغة JSON');
        return;
      }
      setKeyFile(file);
    }
  };

  const handleUploadKey = async () => {
    if (!keyFile) {
      toast.error('يرجى اختيار ملف المفتاح');
      return;
    }

    setUploadingKey(true);
    const formData = new FormData();
    formData.append('keyFile', keyFile);

    try {
      const response = await fetch(`${API_URL}/api/admin/settings/gcs/key`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('تم رفع ملف المفتاح بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في رفع ملف المفتاح');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setUploadingKey(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!bucketName || !projectId) {
      toast.error('يرجى إدخال اسم الحاوية ومعرف المشروع');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/gcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName, projectId }),
      });

      if (response.ok) {
        toast.success('تم حفظ الإعدادات بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/gcs/test`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.message} ✓`);
        onConfigured(); // Refresh parent component
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في الاتصال');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-2">
          📘 خطوات الإعداد:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600 dark:text-blue-400 pr-4">
          <li>أدخل اسم الحاوية (Bucket Name) ومعرف المشروع</li>
          <li>ارفع ملف مفتاح الخدمة (Service Account Key - JSON)</li>
          <li>اضغط "اختبار الاتصال" للتحقق من الإعدادات</li>
          <li>إذا نجح الاختبار، سيتم تفعيل النسخ الاحتياطي التلقائي</li>
        </ol>
      </div>

      {/* Bucket Name */}
      <div>
        <label className="text-sm font-bold text-text-secondary block mb-2">
          اسم الحاوية (Bucket Name)
        </label>
        <input
          type="text"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none text-text-primary font-mono"
          placeholder="my-backup-bucket"
        />
      </div>

      {/* Project ID */}
      <div>
        <label className="text-sm font-bold text-text-secondary block mb-2">
          معرف المشروع (Project ID)
        </label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none text-text-primary font-mono"
          placeholder="my-project-12345"
        />
      </div>

      {/* Save Credentials Button */}
      <button
        onClick={handleSaveSettings}
        disabled={saving || !bucketName || !projectId}
        className="w-full px-6 py-3 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main dark:text-brand-secondary rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
      </button>

      {/* Service Account Key Upload */}
      <div>
        <label className="text-sm font-bold text-text-secondary block mb-2">
          مفتاح الخدمة (Service Account Key JSON)
        </label>
        <div className="flex gap-2">
          <label className="flex-1 px-4 py-3 bg-bg-primary border-2 border-dashed border-border-theme rounded-xl cursor-pointer hover:border-brand-main/30 transition">
            <input
              type="file"
              accept=".json"
              onChange={handleKeyFileChange}
              className="hidden"
            />
            <div className="text-center">
              {keyFile ? (
                <span className="text-sm font-bold text-brand-main">{keyFile.name}</span>
              ) : (
                <span className="text-sm text-text-muted">📁 اختر ملف JSON</span>
              )}
            </div>
          </label>
          <button
            onClick={handleUploadKey}
            disabled={uploadingKey || !keyFile}
            className="px-6 py-3 bg-brand-secondary text-brand-main rounded-xl font-bold hover:bg-brand-secondary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploadingKey ? 'جاري الرفع...' : 'رفع'}
          </button>
        </div>
      </div>

      {/* Test Connection */}
      <button
        onClick={handleTestConnection}
        disabled={testing}
        className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {testing ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            جاري الاختبار...
          </>
        ) : (
          <>
            <FileCheck className="w-5 h-5" />
            اختبار الاتصال
          </>
        )}
      </button>
    </div>
  );
};

const BackupSettings = () => {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchBackupStatus();
    fetchBackupList();
  }, []);

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/backup/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch backup status:', error);
      toast.error('فشل في جلب حالة النسخ الاحتياطي');
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupList = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/backup/list`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Failed to fetch backup list:', error);
    }
  };

  const handleManualBackup = async () => {
    setBackingUp(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/backup`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
        fetchBackupStatus();
        fetchBackupList();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في إنشاء النسخة الاحتياطية');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!window.confirm(`هل أنت متأكد من استعادة النسخة: ${filename}؟\n\nسيتم استبدال قاعدة البيانات الحالية.`)) {
      return;
    }

    setRestoring(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/backup/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'تم استعادة قاعدة البيانات بنجاح');
        
        // Recommend app restart
        if (window.confirm('يُنصح بإعادة تشغيل التطبيق. هل تريد إعادة التحميل الآن؟')) {
          window.location.reload();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في استعادة النسخة الاحتياطية');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-main" />
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-bg-surface rounded-3xl p-8 border border-border-theme">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">إعداد التخزين السحابي</h2>
                <p className="text-sm text-text-muted mt-1">قم بتكوين Google Cloud Storage للنسخ الاحتياطي</p>
              </div>
            </div>

            <GCSConfigurationForm onConfigured={() => {
              fetchBackupStatus();
              fetchBackupList();
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-in fade-in duration-500 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary flex items-center gap-3">
          <Cloud className="w-10 h-10 text-brand-secondary" />
          النسخ الاحتياطي التلقائي
        </h1>
        <p className="text-text-muted mt-2">نظام النسخ الاحتياطي السحابي لقاعدة البيانات</p>
      </header>

      {/* Status Card */}
      <div className="bg-bg-surface rounded-3xl p-6 mb-6 border border-border-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              status.lastBackup ? 'bg-green-500/10' : 'bg-gray-500/10'
            }`}>
              {status.lastBackup ? (
                <FileCheck className="w-8 h-8 text-green-500" />
              ) : (
                <Database className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">آخر نسخة احتياطية</h3>
              {status.lastBackup ? (
                <>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatTimestamp(status.lastBackup.timestamp)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(status.lastBackup.size)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted mt-1">لا توجد نسخ احتياطية</p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleManualBackup}
            disabled={backingUp}
            className="px-6 py-3 bg-brand-secondary text-brand-main rounded-xl font-bold hover:bg-brand-secondary/90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {backingUp ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                جاري النسخ...
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                نسخ احتياطي الآن
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-bold">
          📅 يتم النسخ الاحتياطي تلقائياً كل يوم في الساعة 3:00 صباحاً
        </p>
      </div>

      {/* Backup History */}
      <div className="bg-bg-surface rounded-3xl p-6 border border-theme">
        <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Download className="w-6 h-6 text-brand-secondary" />
          سجل النسخ الاحتياطية
        </h3>

        {backups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
            <p className="text-text-muted">لا توجد نسخ احتياطية متاحة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="bg-bg-primary rounded-2xl p-4 border border-border-theme hover:border-brand-main/30 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Database className="w-8 h-8 text-brand-secondary" />
                  <div>
                    <p className="font-bold text-text-primary">{backup.filename}</p>
                    <p className="text-xs text-text-muted">
                      {formatTimestamp(backup.timestamp)} • {formatFileSize(backup.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRestore(backup.filename)}
                  disabled={restoring}
                  className="px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main dark:text-brand-secondary rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${restoring ? 'animate-spin' : ''}`} />
                  استعادة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupSettings;
