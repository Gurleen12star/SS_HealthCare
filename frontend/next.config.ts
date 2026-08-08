import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['gurleens-macbook-air.local', '172.25.186.57', 'localhost', '127.0.0.1', '192.168.1.2', 'qty-ceramic-tend-arrived.trycloudflare.com'],
  async rewrites() {
    return [
      {
        source: '/api/predict',
        destination: 'http://127.0.0.1:8000/predict',
      },
      {
        source: '/api/predict_jaundice',
        destination: 'http://127.0.0.1:8000/predict_jaundice',
      },
      {
        source: '/api/predict_heart_rate',
        destination: 'http://127.0.0.1:8000/predict_heart_rate',
      },
    ];
  },
};

export default nextConfig;
