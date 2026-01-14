import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'images/**/*'],
            manifest: {
                name: 'English Fluency Journey',
                short_name: 'Fluency Journey',
                description: 'Read the World, Speak with Confidence. 90-day English reading practice challenge.',
                theme_color: '#921b1e',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/favicon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: '/favicon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            },
            workbox: {
                // Cache all static assets
                globPatterns: ['**/*.{js,css,html,ico,png,jpg,webp,svg,json}'],
                // Cache API responses and external resources
                runtimeCaching: [
                    {
                        // Cache story data JSON files
                        urlPattern: /\/src\/data\/.*\.json$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'story-data-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        // Cache images
                        urlPattern: /\/images\/.*\.(webp|jpg|png|gif)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        // Cache Dictionary API responses
                        urlPattern: /^https:\/\/api\.dictionaryapi\.dev/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'dictionary-cache',
                            expiration: {
                                maxEntries: 500,
                                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // Cache Google Fonts
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    }
                ]
            }
        })
    ],
})
