import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Theme } from '../constants/Theme';

export type RevenueChartPoint = {
  label: string;
  value: number;
  height: number;
};

type Props = {
  data: RevenueChartPoint[];
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  width: number;
};

const CHART_HEIGHT = 96;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;
const DRAW_DURATION = 650;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const buildPath = (points: { x: number; y: number }[], close: boolean, baseY: number) => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return close ? `M ${p.x} ${baseY} L ${p.x} ${p.y} Z` : `M ${p.x} ${p.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  if (close) {
    const last = points[points.length - 1];
    d += ` L ${last.x} ${baseY} L ${points[0].x} ${baseY} Z`;
  }
  return d;
};

const polylineLength = (points: { x: number; y: number }[]) => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  // curve is slightly longer than the straight polyline
  return total * 1.15 || 1;
};

type DotProps = {
  cx: number;
  cy: number;
  delay: number;
  isSelected: boolean;
  isDimmed: boolean;
};

const AnimatedDot = ({ cx, cy, delay, isSelected, isDimmed }: DotProps) => {
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = 0;
    appear.value = withDelay(delay, withTiming(1, { duration: 260 }));
  }, [cx, cy, delay]);

  const animatedProps = useAnimatedProps(() => {
    const baseR = isSelected ? 5 : 3.5;
    return {
      r: interpolate(appear.value, [0, 1], [0, baseR], Extrapolation.CLAMP),
      opacity: (isDimmed ? 0.35 : 1) * appear.value,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={cx}
      cy={cy}
      fill={isSelected ? Theme.colors.primary : '#FFFFFF'}
      stroke="#FFFFFF"
      strokeWidth={isSelected ? 2.5 : 0}
    />
  );
};

export default function RevenueLineChart({ data, selectedIndex, onSelectIndex, width }: Props) {
  const progress = useSharedValue(0);

  const chartWidth = Math.max(width, 1);
  const dataKey = data.map((d) => `${d.label}:${d.height.toFixed(1)}`).join('|');

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: DRAW_DURATION, easing: Easing.out(Easing.cubic) });
  }, [dataKey]);

  const colWidth = chartWidth / Math.max(data.length, 1);
  const plotBottom = CHART_HEIGHT - PAD_BOTTOM;
  const plotRange = plotBottom - PAD_TOP;

  const points = data.map((d, i) => ({
    x: colWidth * (i + 0.5),
    y: plotBottom - (Math.max(0, Math.min(d.height, 100)) / 100) * plotRange,
  }));

  const linePath = buildPath(points, false, plotBottom);
  const areaPath = buildPath(points, true, plotBottom);
  const lineLength = polylineLength(points);

  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: lineLength * (1 - progress.value),
  }));

  const areaAnimatedProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.15, 1], Extrapolation.CLAMP),
  }));

  if (data.length === 0) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={{ width: chartWidth, height: CHART_HEIGHT }}>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <Line
            x1={0}
            y1={plotBottom}
            x2={chartWidth}
            y2={plotBottom}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />

          <AnimatedPath animatedProps={areaAnimatedProps} d={areaPath} fill="url(#revFill)" />

          <AnimatedPath
            animatedProps={lineAnimatedProps}
            d={linePath}
            stroke="#FFFFFF"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={lineLength}
          />

          {points.map((p, i) => (
            <AnimatedDot
              key={`${dataKey}-dot-${i}`}
              cx={p.x}
              cy={p.y}
              delay={DRAW_DURATION * 0.35 + (i / Math.max(points.length - 1, 1)) * DRAW_DURATION * 0.6}
              isSelected={selectedIndex === i}
              isDimmed={selectedIndex !== null && selectedIndex !== i}
            />
          ))}
        </Svg>

        <View style={styles.touchRow} pointerEvents="box-none">
          {data.map((d, i) => (
            <TouchableOpacity
              key={`${d.label}-${i}`}
              style={styles.touchCol}
              activeOpacity={0.7}
              onPress={() => onSelectIndex(selectedIndex === i ? null : i)}
            />
          ))}
        </View>
      </View>

      <View style={styles.labelRow}>
        {data.map((d, i) => {
          const isActive = selectedIndex === null || selectedIndex === i;
          return (
            <Animated.Text
              key={`${dataKey}-label-${i}`}
              entering={FadeIn.duration(300).delay(80 * i)}
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {d.label}
            </Animated.Text>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  touchRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchCol: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Theme.typography.bodyMedium,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  labelActive: {
    color: 'rgba(255,255,255,1)',
    fontFamily: Theme.typography.bodyBold,
  },
});
