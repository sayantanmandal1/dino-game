import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Code,
  Psychology,
  Science,
  GitHub,
  LinkedIn,
  Email,
  Star,
  Bolt,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const About = () => {
  const technologies = [
    { name: 'React', category: 'Frontend', icon: <Code />, color: '#61dafb' },
    { name: 'Material-UI', category: 'UI', icon: <Code />, color: '#0081cb' },
    { name: 'Framer Motion', category: 'Animation', icon: <Bolt />, color: '#ff6b6b' },
    { name: 'Recharts', category: 'Visualization', icon: <Timeline />, color: '#00d4ff' },
    { name: 'FastAPI', category: 'Backend', icon: <Code />, color: '#009688' },
    { name: 'NEAT Algorithm', category: 'AI', icon: <Psychology />, color: '#ff6b35' },
    { name: 'Python', category: 'Language', icon: <Code />, color: '#3776ab' },
    { name: 'Pygame', category: 'Game Engine', icon: <Code />, color: '#ffd700' },
  ];

  const features = [
    'Real-time AI training with NEAT algorithm',
    'Interactive neural network visualization',
    'Professional game engine with physics',
    'Advanced training analytics and charts',
    'Model management and versioning',
    'Responsive design with animations',
    'WebSocket real-time updates',
    'Professional UI/UX design',
  ];

  const team = [
    {
      name: 'AI Developer',
      role: 'Lead Developer',
      description: 'Full-stack development, AI implementation, and system architecture',
      skills: ['Python', 'React', 'FastAPI', 'NEAT', 'Machine Learning'],
    },
  ];

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" sx={{ mb: 4, fontWeight: 700 }}>
          ℹ️ About
        </Typography>
      </motion.div>

      <Grid container spacing={4}>
        {/* Project Overview */}
        <Grid xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Project Overview
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                  The Dino AI Trainer is a cutting-edge platform that demonstrates the power of 
                  NeuroEvolution of Augmenting Topologies (NEAT) algorithm in training artificial 
                  intelligence to master the classic Chrome Dinosaur Game. This project showcases 
                  advanced AI techniques, real-time visualization, and professional software engineering.
                </Typography>

                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                  Our platform provides an interactive environment where users can train neural networks, 
                  visualize the evolutionary process in real-time, and test AI models against the game. 
                  The system uses sophisticated algorithms to evolve neural networks that can navigate 
                  obstacles, jump at the right moments, and achieve high scores.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  <Chip icon={<Star />} label="Advanced AI" color="primary" />
                  <Chip icon={<Bolt />} label="Real-time Training" color="secondary" />
                  <Chip icon={<Timeline />} label="Interactive Visualization" color="success" />
                  <Chip icon={<Science />} label="Research Grade" color="warning" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Technology Stack
                </Typography>

                <Grid container spacing={2}>
                  {technologies.map((tech, index) => (
                    <Grid xs={12} sm={6} md={4} key={tech.name}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                      >
                        <Card
                          sx={{
                            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1))',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                              borderColor: tech.color,
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Box sx={{ color: tech.color, mb: 1 }}>
                              {tech.icon}
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {tech.name}
                            </Typography>
                            <Chip
                              label={tech.category}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: tech.color, color: tech.color }}
                            />
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Key Features
                </Typography>

                <Grid container spacing={2}>
                  {features.map((feature, index) => (
                    <Grid xs={12} sm={6} key={feature}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                            }}
                          />
                          <Typography variant="body1">
                            {feature}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Team & Contact */}
        <Grid xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Development Team
                </Typography>

                {team.map((member, index) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {member.name}
                      </Typography>
                      <Chip
                        label={member.role}
                        color="primary"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {member.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {member.skills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Contact & Links
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon sx={{ color: '#00d4ff' }}>
                      <GitHub />
                    </ListItemIcon>
                    <ListItemText
                      primary="GitHub Repository"
                      secondary="View source code and contribute"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: '#ff6b35' }}>
                      <LinkedIn />
                    </ListItemIcon>
                    <ListItemText
                      primary="LinkedIn Profile"
                      secondary="Connect professionally"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: '#00ff88' }}>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Contact"
                      secondary="Get in touch for questions"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Project Statistics
                </Typography>

                <Grid container spacing={2}>
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                        10+
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Features
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>
                        8
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Technologies
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00ff88', fontWeight: 700 }}>
                        100%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Responsive
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                        FAANG
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Level Quality
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            © 2024 Dino AI Trainer. Built with ❤️ using cutting-edge AI and modern web technologies.
            This project demonstrates professional full-stack development and advanced machine learning techniques.
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default About; 
