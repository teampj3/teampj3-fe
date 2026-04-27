import React, { useEffect, useMemo, useState } from 'react';
import { FileCode2, FileText, Loader2, UploadCloud } from 'lucide-react';
import { fetchReports, uploadFeatureFile } from './api';

const tabs = [
  { id: 'upload', label: '파일 업로드', icon: UploadCloud },
  { id: 'reports', label: '리포트 파일 보기', icon: FileText },
];

function normalizeReports(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.reports)) return value.reports;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function getReportDate(report) {
  return report?.createdAt || report?.created_at || report?.updatedAt || '';
}

function getReportKey(report, index) {
  return report?.id || report?.reportId || `${report?.fileName || report?.name || 'report'}-${index}`;
}

function getStatusClassName(status) {
  return status?.toLowerCase() === 'failed' ? 'status-badge failed' : 'status-badge';
}

function sortReportsByNewest(reports) {
  return [...reports].sort((a, b) => {
    const aTime = new Date(getReportDate(a)).getTime();
    const bTime = new Date(getReportDate(b)).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [reports, setReports] = useState([]);
  const [selectedReportKey, setSelectedReportKey] = useState('');
  const [reportError, setReportError] = useState('');
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const selectedReport = useMemo(() => {
    return reports.find((report, index) => getReportKey(report, index) === selectedReportKey) || reports[0];
  }, [reports, selectedReportKey]);

  async function loadReports({ selectLatest = false } = {}) {
    setIsLoadingReports(true);
    setReportError('');

    try {
      const result = await fetchReports();
      const sortedReports = sortReportsByNewest(normalizeReports(result));
      setReports(sortedReports);
      setSelectedReportKey((currentKey) => {
        if (selectLatest) {
          return sortedReports.length > 0 ? getReportKey(sortedReports[0], 0) : '';
        }

        if (sortedReports.some((report, index) => getReportKey(report, index) === currentKey)) {
          return currentKey;
        }

        return sortedReports.length > 0 ? getReportKey(sortedReports[0], 0) : '';
      });
    } catch (error) {
      setReportError(error.message);
      setReports([]);
      setSelectedReportKey('');
    } finally {
      setIsLoadingReports(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage('');

    try {
      await uploadFeatureFile(selectedFile);
      setUploadMessage('업로드 완료. 백엔드에서 GTest 케이스와 리포트를 생성합니다.');
      setSelectedFile(null);
      await loadReports({ selectLatest: true });
    } catch (error) {
      setUploadMessage(`업로드 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Team_3</p>
        </div>
        <nav className="tab-list" aria-label="주요 메뉴">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeTab === id ? 'tab-button active' : 'tab-button'}
              type="button"
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'upload' ? (
        <section className="panel" aria-labelledby="upload-title">
          <div className="panel-heading">
            <FileCode2 size={24} aria-hidden="true" />
            <div>
              <h2 id="upload-title">피처 파일 업로드</h2>
              <p>업로드된 파일은 백엔드로 전송되어 Claude API 기반 GTest 생성 흐름에 들어갑니다.</p>
            </div>
          </div>

          <form className="upload-box" onSubmit={handleSubmit}>
            <label className="drop-zone">
              <UploadCloud size={42} aria-hidden="true" />
              <strong>{selectedFile ? selectedFile.name : '파일 선택'}</strong>
              <span>{selectedFile ? `${Math.ceil(selectedFile.size / 1024)} KB` : 'feature, txt, cpp, h 파일 업로드'}</span>
              <input
                type="file"
                accept=".feature,.txt,.cpp,.cc,.cxx,.h,.hpp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </label>

            <button className="primary-button" disabled={!selectedFile || isUploading} type="submit">
              {isUploading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <UploadCloud size={18} aria-hidden="true" />}
              <span>{isUploading ? '업로드 중' : '업로드'}</span>
            </button>
          </form>

          {uploadMessage && <p className="status-message">{uploadMessage}</p>}
        </section>
      ) : (
        <section className="panel" aria-labelledby="reports-title">
          <div className="panel-heading row-heading">
            <div className="inline-title">
              <FileText size={24} aria-hidden="true" />
              <div>
                <h2 id="reports-title">리포트 파일 보기</h2>
                <p>백엔드 DB에 저장된 리포트 목록을 조회합니다.</p>
              </div>
            </div>
            <button className="secondary-button" type="button" onClick={loadReports} disabled={isLoadingReports}>
              {isLoadingReports ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
              <span>새로고침</span>
            </button>
          </div>

          {reportError ? <p className="error-message">리포트 조회 실패: {reportError}</p> : null}

          <div className="report-layout">
            <div className="report-list">
              {isLoadingReports ? (
                <p className="empty-state">리포트 불러오는 중</p>
              ) : reports.length === 0 ? (
                <p className="empty-state">아직 표시할 리포트가 없습니다.</p>
              ) : (
                reports.map((report, index) => {
                  const reportKey = getReportKey(report, index);
                  const isSelected = reportKey === selectedReportKey || (!selectedReportKey && index === 0);

                  return (
                  <button
                    className={isSelected ? 'report-item selected' : 'report-item'}
                    key={reportKey}
                    type="button"
                    onClick={() => setSelectedReportKey(reportKey)}
                  >
                    <strong>{report.title || report.fileName || report.name || `Report #${index + 1}`}</strong>
                    <span>{formatDate(getReportDate(report))}</span>
                    {report.status ? <em className={getStatusClassName(report.status)}>{report.status}</em> : null}
                  </button>
                  );
                })
              )}
            </div>

            <div className="report-preview">
              <h3>최근 리포트</h3>
              {selectedReport ? (
                <pre>{selectedReport.content || selectedReport.report || selectedReport.summary || JSON.stringify(selectedReport, null, 2)}</pre>
              ) : (
                <p className="empty-state">리포트를 선택하면 내용이 표시됩니다.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
