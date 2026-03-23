import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				dashboard: resolve(__dirname, "dashboard.html"),
				panden: resolve(__dirname, "panden.html"),
				huurders: resolve(__dirname, "huurders.html"),
				contracten: resolve(__dirname, "contracten.html"),
				onderhoud: resolve(__dirname, "onderhoud.html"),
				financieel: resolve(__dirname, "financieel.html"),
				werkbonnen: resolve(__dirname, "werkbonnen.html"),
				admin: resolve(__dirname, "admin.html"),
			},
		},
	},
	server: {
		port: 3000,
		open: true,
	},
});
