"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { PracticeProblemCard } from "@/components/cards/practice-problem-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Filter, Shuffle, Trophy, Target, Flame } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const problems = [
  {
    id: "1",
    title: "Sum of Array Elements",
    description: "Write a function that takes an array of numbers and returns the sum of all elements. Consider edge cases like empty arrays.",
    difficulty: "Easy" as const,
    topic: "Arrays",
    hint: "Use a loop to iterate through each element and add it to an accumulator variable.",
    expectedOutput: "sumArray([1, 2, 3, 4, 5]) => 15",
    isCompleted: true,
  },
  {
    id: "2",
    title: "Reverse a String",
    description: "Create a function that reverses a string without using the built-in reverse method. Handle empty strings gracefully.",
    difficulty: "Easy" as const,
    topic: "Strings",
    hint: "You can iterate from the end of the string or use a stack approach.",
    expectedOutput: 'reverseString("hello") => "olleh"',
    isCompleted: true,
  },
  {
    id: "3",
    title: "Fibonacci Sequence",
    description: "Implement a function that returns the nth number in the Fibonacci sequence using recursion. Optimize for performance.",
    difficulty: "Medium" as const,
    topic: "Recursion",
    hint: "Remember the base cases: fib(0) = 0 and fib(1) = 1. Consider memoization.",
    expectedOutput: "fibonacci(10) => 55",
    isCompleted: false,
  },
  {
    id: "4",
    title: "Two Sum",
    description: "Given an array of integers and a target sum, find two numbers that add up to the target. Return their indices.",
    difficulty: "Medium" as const,
    topic: "Arrays",
    hint: "Use a hash map to store complements as you iterate through the array.",
    expectedOutput: "twoSum([2, 7, 11, 15], 9) => [0, 1]",
    isCompleted: false,
  },
  {
    id: "5",
    title: "Palindrome Checker",
    description: "Write a function that checks if a given string is a palindrome, ignoring case and non-alphanumeric characters.",
    difficulty: "Easy" as const,
    topic: "Strings",
    hint: "Clean the string first, then compare it with its reverse.",
    expectedOutput: 'isPalindrome("A man, a plan, a canal: Panama") => true',
    isCompleted: false,
  },
  {
    id: "6",
    title: "Merge Sorted Arrays",
    description: "Merge two sorted arrays into one sorted array. Do this in O(n+m) time complexity.",
    difficulty: "Medium" as const,
    topic: "Sorting",
    hint: "Use two pointers, one for each array, and compare elements as you go.",
    expectedOutput: "mergeSorted([1, 3, 5], [2, 4, 6]) => [1, 2, 3, 4, 5, 6]",
    isCompleted: false,
  },
  {
    id: "7",
    title: "Binary Search",
    description: "Implement binary search algorithm to find an element in a sorted array. Return -1 if not found.",
    difficulty: "Medium" as const,
    topic: "Algorithms",
    hint: "Divide the search space in half each iteration by comparing with the middle element.",
    expectedOutput: "binarySearch([1, 2, 3, 4, 5], 3) => 2",
    isCompleted: false,
  },
  {
    id: "8",
    title: "Linked List Reversal",
    description: "Reverse a singly linked list in-place. Return the new head of the reversed list.",
    difficulty: "Hard" as const,
    topic: "Data Structures",
    hint: "Use three pointers: previous, current, and next. Update links as you traverse.",
    expectedOutput: "reverseList(1->2->3->4) => 4->3->2->1",
    isCompleted: false,
  },
]

const topics = ["All", "Arrays", "Strings", "Recursion", "Sorting", "Algorithms", "Data Structures"]

export default function PracticePage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")

  const completedCount = problems.filter((p) => p.isCompleted).length
  const totalCount = problems.length
  const progress = (completedCount / totalCount) * 100

  const filteredProblems = problems.filter((problem) => {
    if (activeTab === "completed" && !problem.isCompleted) return false
    if (activeTab === "pending" && problem.isCompleted) return false
    if (selectedTopics.length > 0 && !selectedTopics.includes(problem.topic)) return false
    return true
  })

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Practice Problems</h1>
            <p className="text-muted-foreground">
              Sharpen your skills with curated coding challenges
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {selectedTopics.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTopics.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {topics.slice(1).map((topic) => (
                  <DropdownMenuCheckboxItem
                    key={topic}
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={() => toggleTopic(topic)}
                  >
                    {topic}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              <Shuffle className="mr-2 h-4 w-4" />
              Random
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold text-foreground">{completedCount}/{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold text-foreground">{completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-xl font-bold text-foreground">5 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-sm font-medium text-foreground">{Math.round(progress)}%</p>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problems Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Problems</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProblems.map((problem) => (
                <PracticeProblemCard
                  key={problem.id}
                  {...problem}
                  onStart={() => console.log(`Starting problem ${problem.id}`)}
                />
              ))}
            </div>
            {filteredProblems.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No problems match your filters.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedTopics([])
                      setActiveTab("all")
                    }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
