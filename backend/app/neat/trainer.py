"""NEAT training orchestration.

Runs generation-by-generation so we can broadcast live progress over a
WebSocket. Uses ``neat.ParallelEvaluator`` to evaluate genomes in parallel
when multiple workers are configured. Falls back to serial evaluation on
Windows-native or when workers == 1 to avoid multiprocessing pickling issues.
"""
from __future__ import annotations

import asyncio
import os
import pickle
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Awaitable, Callable, Optional

import neat
from loguru import logger

from .. import physics as P
from ..simulator import DinoSimulator
from .inference import decide


# Module-level function so ParallelEvaluator can pickle it.
def _eval_genome(genome, config) -> float:
    net = neat.nn.FeedForwardNetwork.create(genome, config)

    def policy(sensors):
        action, _ = decide(net, sensors)
        return action

    # Deterministic fitness across a few seeds to reduce variance
    fitness_total = 0.0
    seeds = (42, 1337, 7)
    for seed in seeds:
        sim = DinoSimulator(seed=seed, max_frames=60 * 45)
        fitness_total += sim.run(policy)
    return fitness_total / len(seeds)


@dataclass
class GenerationReport:
    generation: int
    best_fitness: float
    mean_fitness: float
    species_count: int
    population_size: int
    elapsed_seconds: float
    best_genome: object


ProgressCallback = Callable[[GenerationReport], Awaitable[None]]


class NeatTrainer:
    """Generation-by-generation NEAT driver."""

    def __init__(
        self,
        base_config_path: Path,
        *,
        population_size: int = 50,
        max_generations: int = 30,
        survival_threshold: float = 0.2,
        compatibility_threshold: float = 3.0,
        workers: int = 1,
    ) -> None:
        self.base_config_path = base_config_path
        self.population_size = population_size
        self.max_generations = max_generations
        self.survival_threshold = survival_threshold
        self.compatibility_threshold = compatibility_threshold
        self.workers = max(1, workers)
        self._stop_flag = False
        self._active_config_path: Optional[Path] = None

    def request_stop(self) -> None:
        self._stop_flag = True

    # ------------------------------------------------------------------
    def _materialize_config(self) -> Path:
        """Write a temp NEAT config with overrides applied."""
        text = Path(self.base_config_path).read_text()

        def sub(key: str, value: str) -> None:
            nonlocal text
            import re

            text = re.sub(rf"^{key}\s*=.*$", f"{key}              = {value}", text, flags=re.MULTILINE)

        sub("pop_size", str(self.population_size))
        sub("survival_threshold", str(self.survival_threshold))
        sub("compatibility_threshold", str(self.compatibility_threshold))

        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".ini", delete=False, encoding="utf-8"
        )
        tmp.write(text)
        tmp.close()
        self._active_config_path = Path(tmp.name)
        return self._active_config_path

    # ------------------------------------------------------------------
    async def run(self, on_generation: Optional[ProgressCallback] = None) -> Optional[object]:
        cfg_path = self._materialize_config()
        config = neat.Config(
            neat.DefaultGenome,
            neat.DefaultReproduction,
            neat.DefaultSpeciesSet,
            neat.DefaultStagnation,
            str(cfg_path),
        )
        pop = neat.Population(config)
        best_genome = None
        loop = asyncio.get_running_loop()

        use_parallel = self.workers > 1 and sys.platform != "win32"
        evaluator = None
        if use_parallel:
            try:
                evaluator = neat.ParallelEvaluator(self.workers, _eval_genome)
                logger.info("NEAT using ParallelEvaluator with {} workers", self.workers)
            except Exception as exc:  # pragma: no cover
                logger.warning("ParallelEvaluator unavailable ({}); falling back to serial", exc)
                evaluator = None

        start = time.perf_counter()

        for gen in range(self.max_generations):
            if self._stop_flag:
                logger.info("Training stopped by request at generation {}", gen)
                break

            gen_start = time.perf_counter()

            def _run_one_generation():
                # Follow neat.Population.run exact ordering
                pop.reporters.start_generation(pop.generation)
                genomes = list(pop.population.items())
                if evaluator is not None:
                    evaluator.evaluate(genomes, config)
                else:
                    for _, g in genomes:
                        g.fitness = _eval_genome(g, config)
                # Determine best
                best = None
                for _, g in genomes:
                    if best is None or (g.fitness is not None and g.fitness > best.fitness):
                        best = g
                pop.reporters.post_evaluate(config, pop.population, pop.species, best)
                if pop.best_genome is None or (best and best.fitness > pop.best_genome.fitness):
                    pop.best_genome = best
                # Reproduce next generation
                pop.population = pop.reproduction.reproduce(
                    config, pop.species, config.pop_size, pop.generation
                )
                # Handle extinction
                if not pop.species.species:
                    pop.reporters.complete_extinction()
                    if config.reset_on_extinction:
                        pop.population = pop.reproduction.create_new(
                            config.genome_type, config.genome_config, config.pop_size
                        )
                # Speciate the new population
                pop.species.speciate(config, pop.population, pop.generation)
                pop.reporters.end_generation(config, pop.population, pop.species)
                pop.generation += 1
                return best

            best = await loop.run_in_executor(None, _run_one_generation)
            best_genome = pop.best_genome

            fitnesses = [g.fitness for _, g in pop.population.items() if g.fitness is not None]
            report = GenerationReport(
                generation=gen + 1,
                best_fitness=float(best_genome.fitness) if best_genome else 0.0,
                mean_fitness=float(sum(fitnesses) / len(fitnesses)) if fitnesses else 0.0,
                species_count=len(pop.species.species),
                population_size=len(pop.population),
                elapsed_seconds=time.perf_counter() - gen_start,
                best_genome=best_genome,
            )
            logger.info(
                "Gen {:03d} | best={:.2f} mean={:.2f} species={} time={:.2f}s",
                report.generation,
                report.best_fitness,
                report.mean_fitness,
                report.species_count,
                report.elapsed_seconds,
            )
            if on_generation:
                await on_generation(report)

        if evaluator is not None:
            try:
                evaluator.__del__()
            except Exception:
                pass

        logger.info("Training done in {:.2f}s", time.perf_counter() - start)

        if self._active_config_path and self._active_config_path.exists():
            try:
                os.unlink(self._active_config_path)
            except OSError:
                pass

        return best_genome


def save_genome(genome: object, path: Path) -> None:
    with open(path, "wb") as f:
        pickle.dump(genome, f)
