import Image from "next/image";
import styles from "./page.module.css";
import Timestamp from "../components/timestamp";

interface ApiMessage {
  message: string
  timestamp: string
  version: string
}

export default async function Home() {
  let apiData: ApiMessage | null = null;
  let error: string | null = null;
  
  try {
    const response = await fetch('http://localhost:3001/api/message', {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    apiData = await response.json();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.apiSection}>
          {error ? (
            <div className={styles.error}>
              <p>エラーが発生しました: {error}</p>
              <p>バックエンドサーバーが起動していることを確認してください。</p>
            </div>
          ) : apiData ? (
            <div className={styles.apiData}>
              <p className={styles.message}>{apiData.message}</p>
              <div className={styles.metadata}>
                <Timestamp timestamp={apiData.timestamp} />
                <p>API バージョン: {apiData.version}</p>
              </div>
            </div>
          ) : (
            <p>データを読み込み中...</p>
          )}
        </div>
      </main>
    </div>
  );
}
