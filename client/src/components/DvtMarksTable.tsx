import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-utils";
import { Calendar, RefreshCw, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Type definitions
interface ClassData {
  count: number;
  totalMarks: number;
  questionCount: number;
}

interface ClassCounts {
  [key: number]: ClassData;
}

interface DayData {
  date: string;
  classes: ClassCounts;
}

interface ApiResponse {
  success: boolean;
  data: DayData[];
  summary?: {
    totalDays: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

interface DateRange {
  startDate: string;
  endDate: string;
}

type ColorClass =
  | "bg-gray-100 text-gray-400"
  | "bg-red-100 text-red-800"
  | "bg-yellow-100 text-yellow-800"
  | "bg-blue-100 text-blue-800"
  | "bg-green-100 text-green-800";

const getPercentageColorClass = (percentage: number): string => {
  if (percentage < 20) return "bg-red-500";
  if (percentage < 30) return "bg-red-400";
  if (percentage < 40) return "bg-red-200";
  if (percentage < 50) return "bg-yellow-500";
  if (percentage < 60) return "bg-yellow-400";
  if (percentage < 70) return "bg-yellow-200";
  if (percentage < 80) return "bg-emerald-300";
  if (percentage < 90) return "bg-emerald-400";
  return "bg-emerald-500";
};

const DvtMarksTable: React.FC = () => {
  const [tableData, setTableData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const baseUrl = import.meta.env.VITE_BASE_URL;

  // Default date range to today
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const classes: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // API call function
  const fetchDvtData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/dvtmarks/dvtmarksbydate`);
      if (!response.ok) throw new Error("Failed to fetch DVT marks");
      const data = await response.json();
      console.log("DVT marks data:", data.data);
      const sortedData = data.data.sort(
        (a: DayData, b: DayData) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      console.log("Sorted DVT data:", sortedData);

      setTableData(sortedData);
    } catch (error) {
      console.error("Error fetching DVT marks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch DVT marks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDvtData();
  }, [dateRange]);

  const handleDateChange = (field: keyof DateRange, value: string): void => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Y.day";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
      });
    }
  };

  const getColorClass = (count: number): ColorClass => {
    if (count === 0) return "bg-gray-100 text-gray-400";
    if (count <= 3) return "bg-red-100 text-red-800";
    if (count <= 5) return "bg-yellow-100 text-yellow-800";
    if (count <= 7) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const getTotalForDay = (dayData: DayData): number => {
    return classes.reduce(
      (total, classNum) => total + (dayData.classes[classNum]?.count || 0),
      0
    );
  };

  const getTotalForClass = (classNum: number): number => {
    return tableData.reduce(
      (total, day) => total + (day.classes[classNum]?.count || 0),
      0
    );
  };

  const exportToCSV = (): void => {
    const headers = ["Date", ...classes.map((c) => `Class ${c}`), "Total"];
    const csvContent = [
      headers.join(","),
      ...tableData.map((row) =>
        [
          row.date,
          ...classes.map((c) => row.classes[c]?.count || 0),
          getTotalForDay(row),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dvt-marks-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = (): void => {
    fetchDvtData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading DVT marks...</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-lg shadow-lg">
      {/* <div className=""> */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">
          DV Period Stats
        </h2>

        {/* Controls
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleDateChange('startDate', e.target.value)
              }
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleDateChange('endDate', e.target.value)
              }
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={tableData.length === 0}
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        </div> */}
      </div>

      {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )} */}

      {/* Table */}
      <div className="overflow-auto h-[350px] thin-scrollbar">
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-1 py-3 text-left font-semibold text-gray-700 min-w-[72px]">
                Class ➡️ Day ⬇️
              </th>
              {classes.map((classNum: number) => (
                <th
                  key={classNum}
                  className="border border-gray-300 px-1 py-3 text-center font-semibold text-gray-700 min-w-[40px]"
                >
                  {classNum}
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                Tot.
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((dayData: DayData, index: number) => (
              <tr
                key={dayData.date}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border border-gray-300 px-1 py-3 font-medium text-gray-800">
                  {formatDate(dayData.date)}
                  <div className="text-xs text-gray-500 mt-1">
                    {/* {dayData.date} */}
                    {new Date(dayData.date)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                      .replace(/\//g, "-")}
                  </div>
                </td>
                {classes.map((classNum: number) => {
                  const classData = dayData.classes[classNum] || {
                    count: 0,
                    totalMarks: 0,
                    questionCount: 0,
                  };
                  const count = classData.count;
                  const totalMarks = classData.totalMarks;
                  const questionCount = classData.questionCount;
                  const maxPossibleMarks = questionCount * 2;
                  const percentage =
                    maxPossibleMarks > 0
                      ? (totalMarks / maxPossibleMarks) * 100
                      : 0;

                  return (
                    <td
                      key={classNum}
                      className="border border-gray-300 px-2 py-3 text-center"
                    >
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm font-medium ${getColorClass(
                          count
                        )}`}
                      >
                        {count}
                      </span>
                      {count > 0 ? (
                        <div className="mt-1 w-full bg-gray-200 rounded h-1.5 dark:bg-gray-700">
                          <div
                            className={`${getPercentageColorClass(
                              percentage
                            )} h-1.5 rounded-full`}
                            style={{}}
                          >
                            {/* <p className="text-xs">{percentage.toFixed(0)}</p> */}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 w-full bg-gray-200 rounded h-1.5 dark:bg-gray-700">
                          <div
                            className={`bg-gray-100 h-1.5 rounded-full`}
                            style={{}}
                          ></div>
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  {getTotalForDay(dayData)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="border border-gray-300 px-4 py-3 text-gray-800">
                Total
              </td>
              {classes.map((classNum: number) => (
                <td 
                  key={classNum}
                  className="border border-gray-300 px-3 py-3 text-center text-gray-800"
                >
                  {getTotalForClass(classNum)}
                </td>
              ))}
              <td className="border border-gray-300 px-4 py-3 text-center text-gray-800 font-bold">
                {tableData.reduce((total: number, day: DayData) => total + getTotalForDay(day), 0)}
              </td>
            </tr>
          </tfoot> */}
        </table>
      </div>

      {/* Description */}
      <div className="mt-4 text-gray-700 text-sm">
        This table shows the count of periods (questions asked) in each class
        for each day. The colored bar below visually represents the
        performance of that class on that day.
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Legend:</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-gray-100 rounded"></span>
          <span className="text-gray-600">No subjects (0)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-red-100 rounded"></span>
          <span className="text-gray-600">Low (1-3)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-yellow-100 rounded"></span>
          <span className="text-gray-600">Medium (4-5)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-blue-100 rounded"></span>
          <span className="text-gray-600">Good (6-7)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-green-100 rounded"></span>
          <span className="text-gray-600">Excellent (8+)</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Performance Legend:</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-red-500 rounded"></span>
          <span className="text-gray-600">Below 20%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-red-400 rounded"></span>
          <span className="text-gray-600">20% - 29%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-red-300 rounded"></span>
          <span className="text-gray-600">30% - 39%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-yellow-500 rounded"></span>
          <span className="text-gray-600">40% - 49%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-yellow-400 rounded"></span>
          <span className="text-gray-600">50% - 59%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-yellow-300 rounded"></span>
          <span className="text-gray-600">60% - 69%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-emerald-300 rounded"></span>
          <span className="text-gray-600">70% - 79%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-emerald-400 rounded"></span>
          <span className="text-gray-600">80% - 89%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 bg-emerald-500 rounded"></span>
          <span className="text-gray-600">90% and above</span>
        </div>
      </div>

      {tableData.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No data available for the selected date range.
        </div>
      )}
    </div>
  );
};

export default DvtMarksTable;
