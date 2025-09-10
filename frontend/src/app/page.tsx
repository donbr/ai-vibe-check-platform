'use client'

import EnhancedChatInterface from '@/components/EnhancedChatInterface'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            AI Vibe Coding Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enhanced prompt engineering and testing platform for AI development
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded mr-2">
              Activity #1 Testing
            </span>
            <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded mr-2">
              Prompt Templates
            </span>
            <span className="inline-block bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
              Few-Shot Examples
            </span>
          </div>
        </div>
        <EnhancedChatInterface />
      </div>
    </main>
  )
}
