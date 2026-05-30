import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";



export default defineConfig({
  plugins: [react()],
  base: '/Expense-Management-ReactJS1/', // ✅ CHỈ THẾ NÀY
})