import React from 'react';

// Stops a crash in one page from white-screening the whole app.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">เกิดข้อผิดพลาดบางอย่าง</h1>
          <p className="text-sm text-slate-400 mt-1">ขออภัยในความไม่สะดวก ลองรีเฟรชหน้าอีกครั้ง</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          >
            รีเฟรชหน้า
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
