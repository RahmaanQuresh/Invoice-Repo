"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/utils";
import { RotateCcw, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FailedJob {
  id: string;
  jobType: string;
  errorMessage: string;
  retryCount: number;
  status: string;
  createdAt: string;
}

export default function AdminFailedJobsPage() {
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/admin/failed-jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch {
      toast.error("Failed to load failed jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/failed-jobs/${jobId}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Job retry initiated");
        loadJobs();
      } else {
        toast.error(data.error?.message || "Failed to retry job");
      }
    } catch {
      toast.error("Failed to retry job");
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Failed Jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Dead letter queue — review and retry failed background jobs.
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-muted-foreground">No failed jobs. Everything is running smoothly.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Failed Jobs ({jobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Job Type</th>
                    <th className="pb-3 font-medium">Error</th>
                    <th className="pb-3 font-medium">Retries</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Failed At</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Badge variant="outline">{job.jobType}</Badge>
                      </td>
                      <td className="py-3 max-w-[300px] truncate text-destructive">
                        {job.errorMessage}
                      </td>
                      <td className="py-3">{job.retryCount}</td>
                      <td className="py-3">
                        <Badge variant="destructive">{job.status}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(job.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              toast.success("Job dismissed");
                              loadJobs();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
