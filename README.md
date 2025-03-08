# radio-extension

## 概要

ブラウザ版[radiko](https://radiko.jp/)の番組を管理するWebサービス。  
お気に入りの番組を登録し、タイムフリーの番組リンクを一覧表示することができる。

公開先URL：https://main.d2hm4cewfatbf9.amplifyapp.com  
※ 要アカウント作成

## 開発環境での実行

[AWS Amplify Gen2](https://docs.amplify.aws/vue/)のsandbox機能を利用する。

### バックエンド

事前に環境変数ファイル`.env.local`を作成する。

```sh
npx dotenv-cli -e .env.local -- ampx sandbox
```

### フロントエンド

```sh
npm install
```

```sh
npm run dev
```
