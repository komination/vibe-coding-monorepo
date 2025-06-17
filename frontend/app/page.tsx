import Image from "next/image";
import styles from "./page.module.css";
import { fetchMessage } from "../lib/api";
import Timestamp from "../components/timestamp";

export default async function Home() {
  let apiData;
  let error;
  
  try {
    apiData = await fetchMessage();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <div className={styles.apiSection}>
          <h2>バックエンドAPIからのメッセージ (SSR)</h2>
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

        <ol>
          <li>
            バックエンド (port 3001) からデータを取得してSSRで表示しています。
          </li>
          <li>フロントエンド (port 4001) で表示されています。</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="http://localhost:3001/api/message"
            target="_blank"
            rel="noopener noreferrer"
          >
            API エンドポイントを確認
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Next.js ドキュメント
          </a>
        </div>
      </main>
    </div>
  );
}
