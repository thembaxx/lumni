export interface TopicData {
	subject: string;
	difficulty: "easy" | "medium" | "hard";
	topicTitle: string;
	summary: string;
}

export const mockTopics: TopicData[] = [
	{
		subject: "Mathematics",
		difficulty: "medium",
		topicTitle: "Quadratic Equations",
		summary:
			"Quadratic equations are polynomial equations of the second degree, typically written in the form ax² + bx + c = 0 where a ≠ 0. These equations can be solved using various methods including factoring, completing the square, or using the quadratic formula. The solutions are called roots or zeros of the equation, and they represent the x-values where the parabola intersects the x-axis. Understanding quadratic equations is fundamental in algebra and has applications in physics, engineering, and many other fields.",
	},
	{
		subject: "Physical Science",
		difficulty: "hard",
		topicTitle: "Newton's Laws of Motion",
		summary:
			"Newton's three laws of motion form the foundation of classical mechanics. The first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force. The second law (F = ma) describes how force equals mass times acceleration. The third law states that for every action, there is an equal and opposite reaction. These laws explain everything from why objects fall to how rockets work and are essential for understanding motion in our everyday world.",
	},
	{
		subject: "Life Sciences",
		difficulty: "easy",
		topicTitle: "Cell Structure",
		summary:
			"Cells are the basic building blocks of all living organisms. They consist of three main parts: the cell membrane, cytoplasm, and nucleus. The cell membrane controls what enters and leaves the cell, the cytoplasm is where most cellular activities occur, and the nucleus contains genetic material. Plant cells also have cell walls and chloroplasts for photosynthesis. Understanding cell structure is crucial for understanding how living things function, grow, and reproduce at the most fundamental level.",
	},
	{
		subject: "Geography",
		difficulty: "medium",
		topicTitle: "Weather and Climate",
		summary:
			"Weather refers to short-term atmospheric conditions including temperature, humidity, precipitation, wind, and clouds. Climate refers to long-term patterns of weather in a particular region over many years. Weather is influenced by factors like air pressure, wind patterns, and ocean currents, while climate is shaped by geography, latitude, and long-term atmospheric circulation. Understanding the difference between weather and climate helps us prepare for daily conditions and understand long-term environmental changes.",
	},
	{
		subject: "History",
		difficulty: "hard",
		topicTitle: "Industrial Revolution",
		summary:
			"The Industrial Revolution began in Britain in the late 18th century and spread throughout the world, transforming economies and societies. Key inventions like the steam engine, spinning jenny, and power loom revolutionized manufacturing and transportation. This period saw the shift from agrarian societies to industrial ones, with mass production replacing craftsmanship. While it brought economic growth and technological advancement, it also led to social challenges including urbanization, labor problems, and environmental changes that continue to affect our world today.",
	},
	{
		subject: "English",
		difficulty: "medium",
		topicTitle: "Literary Devices",
		summary:
			'Literary devices are techniques that writers use to express ideas and enhance their writing. Common devices include metaphor (comparing two unlike things), simile (comparing using "like" or "as"), personification (giving human qualities to non-human things), and foreshadowing (hinting at future events). Authors use these devices to make their writing more engaging and to convey deeper meanings. Understanding literary devices helps readers appreciate the artistry in writing and better understand the author\'s intended message and themes.',
	},
];

export const getRandomTopic = (): TopicData => {
	const randomIndex = Math.floor(Math.random() * mockTopics.length);
	return mockTopics[randomIndex];
};

export const getDifficultyColor = (
	difficulty: TopicData["difficulty"],
): string => {
	switch (difficulty) {
		case "easy":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
		case "medium":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
		case "hard":
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
	}
};
