import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginCustomer } from "@/api/auth";

export default function ApiTestPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await loginCustomer({
        email: "test@gmail.com",
        password: "123456",
      });
      setResult(response.data);
    } catch (error: any) {
      setResult(error?.response?.data ?? { message: error?.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border rounded-lg bg-card p-6 space-y-4">
        <h1 className="text-2xl font-semibold">API Test</h1>
        <p className="text-muted-foreground">
          Click the button below to trigger <code>POST /api/auth/login/customer</code>.
        </p>
        <Button onClick={handleTest} disabled={loading} data-testid="btn-test-login">
          {loading ? "Testing..." : "Test Login Customer API"}
        </Button>
        <pre
          className="bg-muted text-sm p-4 rounded min-h-[200px] overflow-auto"
          data-testid="result-panel"
        >
          {result ? JSON.stringify(result, null, 2) : "No response yet"}
        </pre>
      </div>
    </div>
  );
}
