import matplotlib.pyplot as plt
import numpy as np
import graphviz
import os
import warnings

# Suppress matplotlib warnings
warnings.filterwarnings("ignore")

def plot_stats(statistics, ylog=False, view=False, filename='avg_fitness.svg'):
    """ Plots the population's average and best fitness. """
    if plt is None:
        warnings.warn("This display is not available due to a missing optional dependency (matplotlib)")
        return

    generation = range(len(statistics.most_fit_genomes))
    best_fitness = [c.fitness for c in statistics.most_fit_genomes]
    avg_fitness = statistics.get_fitness_mean()
    stdev_fitness = statistics.get_fitness_stdev()

    plt.figure(figsize=(10, 6))
    plt.plot(generation, avg_fitness, 'b-', label="average")
    plt.plot(generation, best_fitness, 'r-', label="best")

    plt.title("Population's average and best fitness")
    plt.xlabel("Generations")
    plt.ylabel("Fitness")
    plt.grid()
    plt.legend(loc="best")
    if ylog:
        plt.gca().set_yscale('symlog')

    plt.savefig(filename)
    if view:
        plt.show()

    plt.close()


def plot_species(statistics, view=False, filename='speciation.svg'):
    """ Visualizes speciation throughout evolution. """
    if plt is None:
        warnings.warn("This display is not available due to a missing optional dependency (matplotlib)")
        return

    species_sizes = statistics.get_species_sizes()
    num_generations = len(species_sizes)
    curves = np.array(list(species_sizes.values()))
    generation = range(num_generations)

    fig, ax = plt.subplots(figsize=(10, 6))
    stack = ax.stackplot(generation, *curves)

    ax.set_title("Speciation")
    ax.set_ylabel("Size per Species")
    ax.set_xlabel("Generations")

    plt.savefig(filename)

    if view:
        plt.show()

    plt.close()


def draw_net(config, genome, view=False, filename=None, node_names=None, show_disabled=True, prune_unused=False,
             node_colors=None, fmt='svg'):
    """ Receives a genome and draws a neural network with arbitrary topology. """
    # Attributes for network nodes.
    if graphviz is None:
        warnings.warn("This display is not available due to a missing optional dependency (graphviz)")
        return

    # If requested, use a copy of the genome with unused nodes pruned.
    if prune_unused:
        genome = genome.prune_connections()

    if node_names is None:
        node_names = {}

    assert type(node_names) is dict

    if node_colors is None:
        node_colors = {}

    assert type(node_colors) is dict

    node_attrs = {
        'shape': 'circle',
        'fontsize': '9',
        'height': '0.2',
        'width': '0.2'}

    dot = graphviz.Digraph(format=fmt, node_attr=node_attrs)

    inputs = set()
    for k in config.genome_config.input_keys:
        inputs.add(k)
        name = node_names.get(k, str(k))
        input_attrs = {'style': 'filled', 'shape': 'box', 'fillcolor': node_colors.get(k, 'lightgray')}
        dot.node(name, _attributes=input_attrs)

    outputs = set()
    for k in config.genome_config.output_keys:
        outputs.add(k)
        name = node_names.get(k, str(k))
        node_attrs = {'style': 'filled', 'fillcolor': node_colors.get(k, 'lightblue')}
        dot.node(name, _attributes=node_attrs)

    for node_key, node_gene in genome.nodes.items():
        if node_key in inputs or node_key in outputs:
            continue

        attrs = {'style': 'filled', 'fillcolor': node_colors.get(node_key, 'white')}
        name = node_names.get(node_key, str(node_key))
        dot.node(name, _attributes=attrs)

    for conn_key, conn_gene in genome.connections.items():
        if not show_disabled and not conn_gene.enabled:
            continue

        from_node, to_node = conn_key
        from_name = node_names.get(from_node, str(from_node))
        to_name = node_names.get(to_node, str(to_node))

        if conn_gene.enabled:
            style = 'solid'
        else:
            style = 'dotted'

        color = 'green' if conn_gene.weight > 0 else 'red'
        width = str(0.1 + abs(conn_gene.weight / 5.0))
        dot.edge(from_name, to_name, _attributes={'style': style, 'color': color, 'penwidth': width})

    dot.render(filename, view=view)
    return dot
