export type Prefecture = {
  id: number;
  name: string;
  region: string;
};

export const PREFECTURES: Prefecture[] = [
  { id: 1, name: '北海道', region: '北海道' },
  { id: 4, name: '宮城県', region: '東北' },
  { id: 13, name: '東京都', region: '関東' },
  { id: 17, name: '石川県', region: '北陸' },
  { id: 26, name: '京都府', region: '関西' },
  { id: 34, name: '広島県', region: '中国' },
  { id: 40, name: '福岡県', region: '九州' },
  { id: 47, name: '沖縄県', region: '沖縄' }
];
