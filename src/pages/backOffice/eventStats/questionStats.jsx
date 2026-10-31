import { useState } from "react";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import { DistanceChips, Empty, Kpi, Panel, SplitBar } from "./parts";
import { DISTANCE_COLORS, STATUS_COLOR, barChart, baseChart, fmtNumber, pct } from "./chartTheme";

const TEXT_PREVIEW = 8;

/**
 * "Survey results" view of the stats page: one chart per registration question, counted from the
 * answers of paid participants, plus the PDPA consent split when the event asks for it.
 */
export default function QuestionStats({ eventId, distances, distance, onDistance }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.toLowerCase().startsWith("en");
  const { data, isFetching } = backOfficeServices.useQueryGetQuestionStats({ eventId, eventTypeId: distance });
  const questions = data?.questions || [];
  const noData = t("back.stats.noData");

  return (
    <div className={`flex flex-col transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      {distances.length > 0 && (
        <div className="bo-card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <span className="text-[13px] font-semibold text-[#1d1d1f]">{t("back.stats.questions.filter")}</span>
          <DistanceChips items={distances} selected={distance} onSelect={onDistance} allLabel={t("back.stats.allDistances")} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3">
        <Kpi label={t("back.stats.questions.participants")} value={fmtNumber(data?.participants)} sub={t("back.stats.questions.paidOnly")} />
        <Kpi label={t("back.stats.questions.count")} value={fmtNumber(questions.length)} />
        {data?.pdpaConsentEnabled || data?.pdpaAccepted || data?.pdpaDeclined ? (
          <div className="bo-card px-4 py-3 min-w-0 flex flex-col justify-center gap-2">
            <div className="text-[12px] text-[#6e6e73]">{t("back.stats.questions.pdpa")}</div>
            <SplitBar
              emptyText={noData}
              parts={[
                { key: "yes", label: t("pdpa.accepted"), value: data?.pdpaAccepted || 0, color: STATUS_COLOR.success },
                { key: "no", label: t("pdpa.declined"), value: data?.pdpaDeclined || 0, color: STATUS_COLOR.failed },
                ...(data?.pdpaUnknown ? [{ key: "na", label: t("back.stats.questions.pdpaNotAsked"), value: data.pdpaUnknown, color: "#a1a1a6" }] : []),
              ]}
            />
          </div>
        ) : (
          <Kpi label={t("back.stats.questions.pdpa")} value="-" sub={t("back.stats.questions.pdpaOff")} />
        )}
      </div>

      {questions.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {questions.map((q) => <QuestionPanel key={q.id} q={q} isEn={isEn} />)}
        </div>
      ) : (
        <div className="bo-card px-4 py-10"><Empty text={t("back.stats.questions.empty")} /></div>
      )}
    </div>
  );
}

function QuestionPanel({ q, isEn }) {
  const { t } = useTranslation();
  const title = (isEn && q.titleEn) || q.title;
  const meta = [q.sectionTitle, q.distanceName || t("back.stats.questions.allDistancesAsked")].filter(Boolean).join(" · ");
  return (
    <Panel
      className="!min-h-[300px]"
      title={
        <span className="block">
          {title}
          <span className="block text-[11px] font-normal text-[#6e6e73] mt-0.5">
            {t(`back.stats.questions.type.${q.type}`)} · {meta}
          </span>
        </span>
      }
      extra={
        <span className="text-[12px] text-[#424245] tabular-nums">
          {t("back.stats.questions.answered", { answered: fmtNumber(q.answered), asked: fmtNumber(q.asked), percent: pct(q.answered, q.asked) })}
        </span>
      }
      bodyClassName="flex flex-col gap-3"
    >
      {!q.answered ? <Empty text={t("back.stats.questions.noAnswers")} /> : <QuestionBody q={q} isEn={isEn} />}
    </Panel>
  );
}

function QuestionBody({ q, isEn }) {
  const { t } = useTranslation();
  const label = (o) => {
    const text = (isEn && o.labelEn) || o.label;
    return o.inputType === "FREE_TEXT" ? `${t("back.stats.questions.other")}${text ? ` (${text})` : ""}` : text || "-";
  };

  if (q.type === "SINGLE" || q.type === "MULTIPLE") {
    const options = q.options || [];
    const labels = options.map(label);
    const counts = options.map((o) => o.count);
    // Single choice adds up to 100% → donut; multiple choice doesn't → bars (share of respondents).
    const chart = q.type === "SINGLE" ? (
      <Chart
        type="donut"
        height={220}
        series={counts}
        options={{
          ...baseChart(),
          labels,
          colors: DISTANCE_COLORS,
          legend: { show: true, position: "bottom", fontSize: "12px" },
          dataLabels: { enabled: true, formatter: (v) => `${Math.round(v)}%` },
          plotOptions: { pie: { donut: { size: "58%" } } },
          stroke: { width: 2, colors: ["#ffffff"] },
          tooltip: { y: { formatter: (v) => `${fmtNumber(v)} (${pct(v, q.answered)}%)` } },
        }}
      />
    ) : (
      <Chart
        type="bar"
        height={Math.max(160, options.length * 38)}
        series={[{ name: t("back.stats.questions.people"), data: counts }]}
        options={horizontalBars(labels, counts, q.answered)}
      />
    );
    return (
      <>
        {chart}
        <TextList title={t("back.stats.questions.otherAnswers")} texts={q.texts} />
      </>
    );
  }

  if (q.type === "RATING") {
    const options = q.options || [];
    return (
      <>
        <div className="text-[13px] text-[#424245]">
          {t("back.stats.questions.average")} <span className="text-[22px] font-bold text-[#1d1d1f]">{q.average ?? "-"}</span> / 5
        </div>
        <Chart
          type="bar"
          height={200}
          series={[{ name: t("back.stats.questions.people"), data: options.map((o) => o.count) }]}
          options={barChart({ categories: options.map((o) => `${o.label} ★`) })}
        />
      </>
    );
  }

  if (q.type === "IMAGE") {
    return (
      <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[260px]">
        {(q.images || []).map((src) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden bg-[#f5f5f7]">
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          </a>
        ))}
      </div>
    );
  }

  return <TextList texts={q.texts} expanded />;
}

/**
 * Horizontal bars for multiple choice. On a horizontal chart the y axis carries the option names,
 * so the shared numeric y formatter is replaced; the x range leaves room for the "n · %" labels.
 */
function horizontalBars(labels, counts, answered) {
  const base = barChart({ categories: labels, horizontal: true });
  const top = Math.max(1, ...counts);
  return {
    ...base,
    xaxis: { ...base.xaxis, max: Math.ceil(top * 1.35), labels: { ...base.xaxis.labels, rotate: 0, formatter: (v) => fmtNumber(Math.round(v)) } },
    yaxis: { labels: { style: base.yaxis.labels.style, maxWidth: 180, formatter: (v) => v } },
    dataLabels: {
      enabled: true,
      formatter: (v) => `${fmtNumber(v)} · ${pct(v, answered)}%`,
      style: { fontSize: "11px", colors: ["#1d1d1f"] },
      offsetX: 30,
    },
    plotOptions: { bar: { horizontal: true, barHeight: "60%", borderRadius: 4, borderRadiusApplication: "end", dataLabels: { position: "top" } } },
  };
}

/** Typed answers, a few at a time. */
function TextList({ title, texts = [], expanded = false }) {
  const { t } = useTranslation();
  const [all, setAll] = useState(false);
  if (!texts.length) return null;
  const shown = all ? texts : texts.slice(0, expanded ? TEXT_PREVIEW * 2 : TEXT_PREVIEW);
  return (
    <div className="min-w-0">
      {title && <div className="text-[12px] font-semibold text-[#424245] mb-1.5">{title} ({fmtNumber(texts.length)})</div>}
      <ul className="m-0 p-0 list-none flex flex-col gap-1 max-h-[240px] overflow-y-auto">
        {shown.map((text, i) => (
          <li key={i} className="text-[12px] text-[#1d1d1f] bg-[#f5f5f7] rounded-md px-2.5 py-1.5 break-words">{text}</li>
        ))}
      </ul>
      {texts.length > shown.length && (
        <button type="button" onClick={() => setAll(true)}
          className="mt-1.5 text-[12px] text-[#0071e3] bg-transparent border-0 p-0 cursor-pointer">
          {t("back.stats.questions.showAll", { count: texts.length })}
        </button>
      )}
    </div>
  );
}
