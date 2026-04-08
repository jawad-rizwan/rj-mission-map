import { useMemo } from 'react';
import { ALL_AIRCRAFT } from '../engine/aircraft';
import { computePayloadRangeCurve } from '../engine/mission';
import { useAppState } from '../store/appState';
import { useUnits } from '../hooks/useUnits';

const CHART_W = 292;
const CHART_H = 220;
const PAD_L = 42;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 30;

interface CurveStyle {
  key: 'ZRJ70' | 'ZRJ100';
  color: string;
  label: string;
}

const CURVES: CurveStyle[] = [
  { key: 'ZRJ70', color: '#4aa3ff', label: 'ZRJ70' },
  { key: 'ZRJ100', color: '#ff7f50', label: 'ZRJ100' },
];

function fmtAxis(value: number): string {
  return `${Math.round(value).toLocaleString()}`;
}

export function PayloadRangePanel() {
  const { aircraftKey, windKts } = useAppState();
  const { convDist, convWeight, distLabel, weightLabel } = useUnits();

  const data = useMemo(() => CURVES.map(curve => ({
    ...curve,
    points: computePayloadRangeCurve(ALL_AIRCRAFT[curve.key], windKts),
  })), [windKts]);

  const xMax = Math.max(
    1,
    ...data.flatMap(curve => curve.points.map(point => point.rangeNm)),
  );
  const yMax = Math.max(
    1,
    ...data.flatMap(curve => curve.points.map(point => point.payloadLb)),
  );

  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const xScale = (nm: number) => PAD_L + (nm / xMax) * plotW;
  const yScale = (lb: number) => PAD_T + plotH - (lb / yMax) * plotH;

  const xTicks = [0, xMax / 2, xMax];
  const yTicks = [0, yMax / 2, yMax];

  return (
    <div className="control-group payload-range-panel">
      <label className="control-label">Payload-Range Diagram</label>

      <svg
        className="payload-range-chart"
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        role="img"
        aria-label="Payload-range diagram for ZRJ70 and ZRJ100"
      >
        {xTicks.map((tick, idx) => (
          <g key={`x-${idx}`}>
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={PAD_T}
              y2={PAD_T + plotH}
              className="payload-range-grid"
            />
            <text
              x={xScale(tick)}
              y={CHART_H - 8}
              textAnchor={idx === 0 ? 'start' : idx === xTicks.length - 1 ? 'end' : 'middle'}
              className="payload-range-axis"
            >
              {fmtAxis(convDist(tick))}
            </text>
          </g>
        ))}

        {yTicks.map((tick, idx) => (
          <g key={`y-${idx}`}>
            <line
              x1={PAD_L}
              x2={PAD_L + plotW}
              y1={yScale(tick)}
              y2={yScale(tick)}
              className="payload-range-grid"
            />
            <text
              x={PAD_L - 8}
              y={yScale(tick) + 4}
              textAnchor="end"
              className="payload-range-axis"
            >
              {fmtAxis(convWeight(tick))}
            </text>
          </g>
        ))}

        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + plotH} className="payload-range-border" />
        <line x1={PAD_L} x2={PAD_L + plotW} y1={PAD_T + plotH} y2={PAD_T + plotH} className="payload-range-border" />

        {data.map(curve => {
          const path = curve.points
            .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(point.rangeNm)} ${yScale(point.payloadLb)}`)
            .join(' ');
          const isSelected = aircraftKey === curve.key;

          return (
            <g key={curve.key}>
              <path
                d={path}
                fill="none"
                stroke={curve.color}
                strokeWidth={isSelected ? 3 : 2}
                opacity={isSelected ? 1 : 0.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {curve.points.at(-1) && (
                <text
                  x={xScale(curve.points.at(-1)!.rangeNm) - 2}
                  y={yScale(curve.points.at(-1)!.payloadLb) - 8}
                  textAnchor="end"
                  className="payload-range-label"
                  fill={curve.color}
                >
                  {curve.label}
                </text>
              )}
            </g>
          );
        })}

        <text
          x={PAD_L + plotW / 2}
          y={CHART_H - 2}
          textAnchor="middle"
          className="payload-range-title"
        >
          Range ({distLabel})
        </text>
        <text
          x={12}
          y={PAD_T + plotH / 2}
          textAnchor="middle"
          className="payload-range-title"
          transform={`rotate(-90 12 ${PAD_T + plotH / 2})`}
        >
          Payload ({weightLabel})
        </text>
      </svg>

      <div className="payload-range-legend">
        <span>Max-fuel payload-range, current wind</span>
        <span>ZRJ50 intentionally omitted</span>
      </div>
    </div>
  );
}
