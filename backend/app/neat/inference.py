"""Inference helpers: load a pickled genome + NEAT config → action decider."""
from __future__ import annotations

import pickle
from pathlib import Path
from typing import List, Tuple

import neat


_ACTIONS = ("jump", "duck", "noop")


def load_genome(pickle_path: Path, config_path: Path) -> Tuple[object, neat.Config]:
    with open(pickle_path, "rb") as f:
        genome = pickle.load(f)
    config = neat.Config(
        neat.DefaultGenome,
        neat.DefaultReproduction,
        neat.DefaultSpeciesSet,
        neat.DefaultStagnation,
        str(config_path),
    )
    return genome, config


def build_net(genome: object, config: neat.Config) -> neat.nn.FeedForwardNetwork:
    return neat.nn.FeedForwardNetwork.create(genome, config)


def decide(net: neat.nn.FeedForwardNetwork, sensors: List[float]) -> Tuple[str, List[float]]:
    outputs = net.activate(sensors)
    idx = max(range(len(outputs)), key=lambda i: outputs[i])
    return _ACTIONS[idx], list(outputs)


def genome_to_graph(genome: object, config: neat.Config) -> dict:
    """Extract a serializable graph representation of a genome."""
    nodes = []
    input_keys = config.genome_config.input_keys
    output_keys = config.genome_config.output_keys

    for k in input_keys:
        nodes.append({"id": int(k), "type": "input", "label": f"in{-k - 1}"})
    for k in output_keys:
        label = _ACTIONS[k] if 0 <= k < len(_ACTIONS) else f"out{k}"
        nodes.append({"id": int(k), "type": "output", "label": label})
    for k, node in genome.nodes.items():
        if k in output_keys:
            # update bias
            for n in nodes:
                if n["id"] == int(k):
                    n["bias"] = float(node.bias)
            continue
        nodes.append({"id": int(k), "type": "hidden", "label": f"h{k}", "bias": float(node.bias)})

    connections = []
    for cg in genome.connections.values():
        if not cg.enabled:
            continue
        src, dst = cg.key
        connections.append(
            {
                "source": int(src),
                "target": int(dst),
                "weight": float(cg.weight),
            }
        )
    return {"nodes": nodes, "connections": connections}
