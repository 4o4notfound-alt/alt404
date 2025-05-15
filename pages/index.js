import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import Papa from "papaparse";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

dayjs.extend(isBetween);
dayjs.extend(isoWeek);

const translations = {
  en: {
    comparison: "Comparison",
    compareDate1: "Period 1 (YYYY or YYYY-MM or YYYY-MM-DD)",
    compareDate2: "Period 2 (YYYY or YYYY-MM or YYYY-MM-DD)",
  },
  id: {
    comparison: "Perbandingan",
    compareDate1: "Periode 1 (YYYY atau YYYY-MM atau YYYY-MM-DD)",
    compareDate2: "Periode 2 (YYYY atau YYYY-MM atau YYYY-MM-DD)",
  },
  zh: {
    comparison: "比较",
    compareDate1: "周期1 (YYYY 或 YYYY-MM 或 YYYY-MM-DD)",
    compareDate2: "周期2 (YYYY 或 YYYY-MM 或 YYYY-MM-DD)",
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [compare1, setCompare1] = useState("");
  const [compare2, setCompare2] = useState("");
  const [lang, setLang] = useState("id");
  const t = translations[lang];

  const filterByPeriod = (value) => {
    if (!value || !data) return [];
    if (value.length === 4) {
      return data.filter(d => d.date.format("YYYY") === value);
    } else if (/^\d{4}-\d{2}$/.test(value)) {
      return data.filter(d => d.date.format("YYYY-MM") === value);
    } else if (/^\d{4}-W\d{1,2}$/.test(value)) {
      const [year, week] = value.split("-W");
      return data.filter(d => d.date.isoWeek() === Number(week) && d.date.year() === Number(year));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return data.filter(d => d.date.format("YYYY-MM-DD") === value);
    }
    return [];
  };

  const avg = (arr, key) => {
    const valid = arr.filter(row => row[key]);
    if (!valid.length) return 0;
    return valid.reduce((sum, row) => sum + Number(row[key]), 0) / valid.length;
  };

  const comparisonChart = useMemo(() => {
    const d1 = filterByPeriod(compare1);
    const d2 = filterByPeriod(compare2);
    if (!d1.length || !d2.length) return null;
    const fields = ["Sleep Score", "Activity Score", "Readiness Score"];
    const chartData = fields.map(field => ({
      name: field,
      [compare1]: Math.round(avg(d1, field)),
      [compare2]: Math.round(avg(d2, field))
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
    const insights = fields.map(field => {
      const a = avg(d1, field);
      const b = avg(d2, field);
      if (a === 0 || b === 0) return null;
      const diff = ((a - b) / b) * 100;
      const diffText = diff > 0 ? `meningkat ${diff.toFixed(1)}%` : `menurun ${Math.abs(diff).toFixed(1)}%`;
      return `${field} ${diffText} dibandingkan periode sebelumnya.`;
    });
    return insights.filter(Boolean);
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Oura Dashboard</h1>
      <div className="mb-4">
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="id">Indonesia</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={t.compareDate1}
          value={compare1}
          onChange={(e) => setCompare1(e.target.value)}
        />
        <input
          type="text"
          placeholder={t.compareDate2}
          value={compare2}
          onChange={(e) => setCompare2(e.target.value)}
        />
      </div>
      {comparisonChart}
      {generateInsights().length > 0 && (
        <ul className="mt-4 list-disc pl-4 text-sm">
          {generateInsights().map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-400 mt-6">© Made by Susilo Team 2025</p>
    </div>
  );
}