import"./globals.css";

export const metadata = {
  title: "Kubernetes Manifest Builder",
  description: "Build Kubernetes CustomResource manifests with AI assistance"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* Container with main content and sidebar */}
        <div className="flex flex-col md:flex-row h-screen">
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
          {/* Assistant sidebar (visible on md+ screens, stacks on small screens) */}
          <aside className="md:w-1/3 p-4 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Assistant</h2>
            <div className="flex-1 min-h-0">
              {/* ChatAssistant is a client component loaded here */}
              <ChatAssistant />
            </div>
          </aside>
        </div>
      </body>
    </html>
  );
}

import ChatAssistant from "@/components/ChatAssistant";
