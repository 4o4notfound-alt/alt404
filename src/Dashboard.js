import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
dayjs.extend(isBetween);
dayjs.extend(isoWeek);

const translations = {
  id: {
    comparison: "Perbandingan",
    compareDate1: "Periode 1 (YYYY-MM-DD / YYYY-MM / YYYY / YYYY-WW)",
    compareDate2: "Periode 2 (YYYY-MM-DD / YYYY-MM / YYYY / YYYY-WW)",
    upload: "Unggah Data",
    notes: "Catatan",
    addNote: "Tambah Catatan",
    sleepScore: "Skor Tidur",
    activityScore: "Skor Aktivitas",
    readinessScore: "Skor Kesiapan",
    insight: "Insight",
    language: "Bahasa",
  },
  en: {
    comparison: "Comparison",
    compareDate1: "Period 1 (YYYY-MM-DD / YYYY-MM / YYYY / YYYY-WW)",
    compareDate2: "Period 2 (YYYY-MM-DD / YYYY-MM / YYYY / YYYY-WW)",
    upload: "Upload Data",
    notes: "Notes",
    addNote: "Add Note",
    sleepScore: "Sleep Score",
    activityScore: "Activity Score",
    readinessScore: "Readiness Score",
    insight: "Insight",
    language: "Language",
  },
  zh: {
    comparison: "比较",
    compareDate1: "期间 1 (YYYY-MM-DD / YYYY-MM / YYYY / YYYY-WW)",
    compareDate2: "期间 2 (YYYY-MM-DD / YYYY-MM / YYYY / YYYY-WW)",
    upload: "上传数据",
    notes: "笔记",
    addNote: "添加笔记",
    sleepScore: "睡眠评分",
    activityScore: "活动评分",
    readinessScore: "准备评分",
    insight: "洞察",
    language: "语言",
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [compare1, setCompare1] = useState("");
  const [compare2, setCompare2] = useState("");
  const [lang, setLang] = useState("id");
  const [notes, setNotes] = useState({});
  const t = translations[lang];

  const filterByPeriod = (value) => {
    if (!value || !data) return [];
    if (value.length === 4) {
      return data.filter((d) => d.date.format("YYYY") === value);
    } else if (/^\d{4}-\d{2}$/.test(value)) {
      return data.filter((d) => d.date.format("YYYY-MM") === value);
    } else if (/^\d{4}-W\d{1,2}$/.test(value)) {
      const [year, week] = value.split("-W");
      return data.filter(
        (d) => d.date.isoWeek() === Number(week) && d.date.year() === Number(year)
      );
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return data.filter((d) => d.date.format("YYYY-MM-DD") === value);
    }
    return [];
  };

  const avg = (arr, key) => {
    const valid = arr.filter((row) => row[key]);
    if (!valid.length) return 0;
    return valid.reduce((sum, row) => sum + Number(row[key]), 0) / valid.length;
  };

  const comparisonChart = useMemo(() => {
    const d1 = filterByPeriod(compare1);
    const d2 = filterByPeriod(compare2);
    if (!d1.length || !d2.length) return null;
    const fields = ["Sleep Score", "Activity Score", "Readiness Score"];
    const chartData = fields.map((field) => ({
      name: field,
      [compare1]: Math.round(avg(d1, field)),
      [compare2]: Math.round(avg(d2, field)),
    }));
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="name" />
          <Tooltip />
          <Legend />
          <Bar dataKey={compare1} fill="#60a5fa" />
          <Bar dataKey={compare2} fill="#34d399" />
        </BarChart>
      </ResponsiveContainer>
    );
  }, [compare1, compare2, data]);

  const generateInsights = () => {
    const d1 = filterByPeriod(compare1);
    const d2 = filterByPeriod(compare2);
    if (!d1.length || !d2.length) return [];
    const fields = ["Sleep Score", "Activity Score", "Readiness Score"];
    const insights = fields.map((field) => {
      const a = avg(d1, field);
      const b = avg(d2, field);
      if (a === 0 || b === 0) return null;
      const diff = ((a - b) / b) * 100;
      const diffText = diff > 0 ? `meningkat ${diff.toFixed(1)}%` : `menurun ${Math.abs(diff).toFixed(1)}%`;
      return `${field} ${diffText} dibandingkan periode sebelumnya.`;
    });
    return insights.filter(Boolean);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsed = results.data
          .filter((r) => r.date)
          .map((r) => ({
            ...r,
            date: dayjs(r.date),
            "Sleep Score": Number(r["Sleep Score"]) || 0,
            "Activity Score": Number(r["Activity Score"]) || 0,
            "Readiness Score": Number(r["Readiness Score"]) || 0,
          }));
        setData(parsed);
      },
    });
  };

  const addNote = (date) => {
    const text = prompt(t.addNote);
    if (text) {
      setNotes((prev) => ({ ...prev, [date]: text }));
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto min-h-screen flex flex-col">
      <header className="mb-4 flex justify-between items-center">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="border px-2 py-1 rounded"
          aria-label={t.language}
        >
          <option value="id">Indonesia</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
        <input type="file" onChange={handleFileUpload} accept=".csv" />
      </header>

      <main className="flex-grow">
        <Tabs defaultValue="comparison">
          <TabsList>
            <TabsTrigger value="comparison">{t.comparison}</TabsTrigger>
          </TabsList>
          <TabsContent value="comparison">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <Input
                    type="text"
                    placeholder={t.compareDate1}
                    value={compare1}
                    onChange={(e) => setCompare1(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder={t.compareDate2}
                    value={compare2}
                    onChange={(e) => setCompare2(e.target.value)}
                  />
                </div>
                {comparisonChart || <p className="text-gray-500">Masukkan dua periode valid untuk perbandingan.</p>}

                {generateInsights().length > 0 && (
                  <div className="mt-4 bg-gray-100 rounded p-4">
                    <h3 className="font-semibold mb-2">{t.insight}</h3>
                    <ul className="list-disc pl-5 text-sm">
                      {generateInsights().map((text, i) => (
                        <li key={i}>{text}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center text-sm text-gray-400 mt-6 py-2 border-t border-gray-300">
        Made by Susilo Team 2025
      </footer>
    </div>
  );
}