// Copyright 2025 Compass
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System.Text.Json;
using System.Diagnostics;

record PromptSpec(string Id, string Prompt, string Expected);
record EvaluationConfig(List<string> Models, List<PromptSpec> Prompts, string? EvaluationModel);

class RunResult {
    public string Model { get; set; } = "";
    public string PromptId { get; set; } = "";
    public int Iteration { get; set; }
    public string RawOutput { get; set; } = "";
    public string GitDiff { get; set; } = "";
    public string EvaluationRaw { get; set; } = "";
    public string Classification { get; set; } = ""; // SUCCESS | PARTIAL | FAILURE
    public int Points { get; set; }
}

class AggregatedResult {
    public string Model { get; set; } = "";
    public string PromptId { get; set; } = "";
    public double AveragePoints { get; set; }
    public int Runs { get; set; }
}

static class Program {
    static int Main(string[] args) {
        string? repoPath = GetArg(args, "--repo-path");
        string? configFile = GetArg(args, "--config");
        string runsArg = GetArg(args, "--runs") ?? "1";
        string outputMode = GetArg(args, "--output") ?? "stdout"; // stdout|json|both
        string? evalModelOverride = GetArg(args, "--eval-model");
        if (repoPath == null || configFile == null) {
            Console.Error.WriteLine("Required: --repo-path <path> --config <file>");
            return 1;
        }
        if (!Directory.Exists(repoPath)) { Console.Error.WriteLine("Repo path not found"); return 1; }
        if (!File.Exists(configFile)) { Console.Error.WriteLine("Config file not found"); return 1; }
        if (!int.TryParse(runsArg, out int runs) || runs < 1) { Console.Error.WriteLine("Invalid --runs"); return 1; }

        var json = File.ReadAllText(configFile);
        var cfg = JsonSerializer.Deserialize<EvaluationConfig>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? throw new("Bad config");
        string evaluationModel = evalModelOverride ?? cfg.EvaluationModel ?? "gpt-4o-copilot"; // default

        var allRunResults = new List<RunResult>();

        foreach (var model in cfg.Models) {
            foreach (var prompt in cfg.Prompts) {
                for (int i = 1; i <= runs; i++) {
                    RunGit(repoPath, "reset --hard");
                    RunGit(repoPath, "clean -fd");

                    var agentOutput = RunProcess(repoPath, "copilot", $"agent --model {Escape(model)} --prompt {EscapeArg(prompt.Prompt)} --non-interactive");
                    var diff = RunGit(repoPath, "--no-pager diff");

                    string evaluationPrompt = $"You are evaluating if a result satisfies an expected outcome. Expected: '{prompt.Expected}'. Copilot agent raw output: '{Truncate(agentOutput, 4000)}'. Git diff produced: '{Truncate(diff, 4000)}'.\nRespond with EXACTLY one of: SUCCESS, PARTIAL, FAILURE.";
                    var evalOutput = RunProcess(repoPath, "copilot", $"cli --model {Escape(evaluationModel)} --prompt {EscapeArg(evaluationPrompt)} --non-interactive");
                    string classification = ParseClassification(evalOutput);
                    int points = classification switch { "SUCCESS" => 10, "PARTIAL" => 5, _ => 0 };

                    allRunResults.Add(new RunResult {
                        Model = model,
                        PromptId = prompt.Id,
                        Iteration = i,
                        RawOutput = agentOutput,
                        GitDiff = diff,
                        EvaluationRaw = evalOutput,
                        Classification = classification,
                        Points = points
                    });
                }
            }
        }

        var aggregates = allRunResults
            .GroupBy(r => (r.Model, r.PromptId))
            .Select(g => new AggregatedResult { Model = g.Key.Model, PromptId = g.Key.PromptId, Runs = g.Count(), AveragePoints = g.Average(r => r.Points) })
            .OrderBy(a => a.Model).ThenBy(a => a.PromptId).ToList();

        if (outputMode is "stdout" or "both") {
            foreach (var a in aggregates) {
                Console.WriteLine($"Model={a.Model} Prompt={a.PromptId} Runs={a.Runs} AvgPoints={a.AveragePoints:F2}");
            }
        }
        if (outputMode is "json" or "both") {
            var outObj = new { results = allRunResults, aggregates };
            Console.WriteLine(JsonSerializer.Serialize(outObj, new JsonSerializerOptions { WriteIndented = true }));
        }
        return 0;
    }

    static string? GetArg(string[] args, string name) {
        var idx = Array.IndexOf(args, name);
        if (idx >= 0 && idx + 1 < args.Length) return args[idx + 1];
        return null;
    }

    static string RunGit(string cwd, string arguments) => RunProcess(cwd, "git", arguments);

    static string RunProcess(string cwd, string fileName, string arguments) {
        try {
            var psi = new ProcessStartInfo(fileName, arguments) {
                WorkingDirectory = cwd,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            var p = Process.Start(psi)!;
            string stdout = p.StandardOutput.ReadToEnd();
            string stderr = p.StandardError.ReadToEnd();
            p.WaitForExit();
            return stdout + (string.IsNullOrWhiteSpace(stderr) ? "" : "\n[stderr]\n" + stderr);
        } catch (Exception ex) { return $"PROCESS_ERROR: {ex.Message}"; }
    }

    static string ParseClassification(string evalOutput) {
        if (evalOutput.Contains("SUCCESS")) return "SUCCESS";
        if (evalOutput.Contains("PARTIAL")) return "PARTIAL";
        if (evalOutput.Contains("FAILURE")) return "FAILURE";
        return "FAILURE";
    }

    static string Escape(string s) => s.Replace("\"", "\\\"");
    static string EscapeArg(string s) => '"' + s.Replace("\"", "\\\"") + '"';
    static string Truncate(string s, int max) => s.Length <= max ? s : s.Substring(0, max);
}
