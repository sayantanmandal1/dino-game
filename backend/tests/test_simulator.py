from app.simulator import DinoSimulator


def test_simulator_deterministic():
    def policy(_):
        return "noop"

    a = DinoSimulator(seed=42, max_frames=400).run(policy)
    b = DinoSimulator(seed=42, max_frames=400).run(policy)
    assert a == b


def test_simulator_jumps_survive_longer():
    def noop(_):
        return "noop"

    def smart(sensors):
        # Jump when obstacle is close
        return "jump" if sensors[0] < 0.18 else "noop"

    dumb_frames = DinoSimulator(seed=1, max_frames=2000)
    dumb_frames.run(noop)

    smart_sim = DinoSimulator(seed=1, max_frames=2000)
    smart_sim.run(smart)

    assert smart_sim.state.frames > dumb_frames.state.frames


def test_sensor_vector_length():
    sim = DinoSimulator(seed=0)
    sensors = sim.sensors()
    assert len(sensors) == 6
    assert all(0.0 <= s <= 1.0 for s in sensors)
