"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CalendarProps {
	className?: string;
	mode?: "single" | "range";
	selected?: Date | Date[] | { from: Date; to: Date } | null;
	onSelect?: (date: Date | undefined) => void;
	numberOfMonths?: number;
	disabled?: (date: Date) => boolean;
	markedDates?: Date[];
	markedDatesColor?: string;
}

function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function Calendar({
	className,
	mode = "single",
	selected,
	onSelect,
	markedDates = [],
	markedDatesColor = "bg-[--system-accent]",
}: CalendarProps) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(
		selected instanceof Date ? selected : null,
	);

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const daysInMonth = getDaysInMonth(year, month);
	const firstDay = getFirstDayOfMonth(year, month);

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

	const isMarked = (day: number) => {
		const date = new Date(year, month, day);
		return markedDates.some((d) => formatDate(d) === formatDate(date));
	};

	const isSelected = (day: number) => {
		const date = new Date(year, month, day);
		return selectedDate && formatDate(date) === formatDate(selectedDate);
	};

	const isToday = (day: number) => {
		const date = new Date(year, month, day);
		const today = new Date();
		return formatDate(date) === formatDate(today);
	};

	const handlePrevMonth = () => {
		setCurrentDate(new Date(year, month - 1, 1));
	};

	const handleNextMonth = () => {
		setCurrentDate(new Date(year, month + 1, 1));
	};

	const handleDayClick = (day: number) => {
		const newDate = new Date(year, month, day);
		setSelectedDate(newDate);
		onSelect?.(newDate);
	};

	const days = [];
	for (let i = 0; i < firstDay; i++) {
		days.push(null);
	}
	for (let i = 1; i <= daysInMonth; i++) {
		days.push(i);
	}

	return (
		<div className={cn("w-full", className)}>
			<div className="flex items-center justify-between mb-4">
				<Button variant="ghost" onClick={handlePrevMonth}>
					<ChevronLeftIcon className="w-5 h-5" />
				</Button>
				<span className="font-semibold text-sm text-wrap balance tabular-nums">
					{monthNames[month]} {year}
				</span>
				<Button variant="ghost" onClick={handleNextMonth}>
					<ChevronRightIcon className="w-5 h-5" />
				</Button>
			</div>

			<div className="grid grid-cols-7 gap-1 mb-2">
				{dayNames.map((day) => (
					<div
						key={day}
						className="text-center text-xs font-medium text-muted-foreground py-2"
					>
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{days.map((day, index) => {
					if (day === null) {
						return <div key={`empty-${index}`} className="aspect-square" />;
					}

					const marked = isMarked(day);
					const selected = isSelected(day);
					const today = isToday(day);

					return (
						<Button
							key={day}
							variant="ghost"
							onClick={() => handleDayClick(day)}
							className={cn(
								"aspect-square rounded-lg text-sm font-medium transition-colors relative",
selected &&
								"bg-[--system-accent] text-background hover:bg-[--system-accent]",
								!selected && "hover:bg-muted",
								today && !selected && "ring-2 ring-[--system-accent] ring-inset",
							)}
						>
							<span className="tabular-nums">{day}</span>
							{marked && !selected && (
								<span
									className={cn(
										"absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
										markedDatesColor,
									)}
								/>
							)}
						</Button>
					);
				})}
			</div>
		</div>
	);
}
