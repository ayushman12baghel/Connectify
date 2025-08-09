import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
import { Button, Typography, Card, CardContent, Box, IconButton } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import ConnectifyIcon from '../components/ConnectifyIcon';

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className="modern-landing-container">
            {/* Enhanced Navigation Bar */}
            <nav className="modern-landing-nav">
                <div className="nav-brand">
                    <ConnectifyIcon sx={{ 
                        fontSize: { xs: 28, sm: 32 }, 
                        color: '#4A90E2', 
                        marginRight: 1,
                        width: { xs: '28px', sm: '32px' },
                        height: { xs: '28px', sm: '32px' }
                    }} />
                    <h2 style={{ 
                        color: '#4A90E2', 
                        fontWeight: 'bold', 
                        margin: 0,
                        fontSize: 'clamp(1.3rem, 4vw, 1.8rem)'
                    }}>
                        Connectify
                    </h2>
                    <span style={{ 
                        color: '#888', 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                        marginLeft: '8px' 
                    }}>
                        Pro
                    </span>
                </div>
                
                <div className="nav-actions">
                    <Button
                        onClick={() => router("/aljk23")}
                        variant="text"
                        startIcon={<PersonIcon />}
                        sx={{ 
                            color: '#4A90E2',
                            marginRight: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}
                    >
                        Guest
                    </Button>
                    <Button
                        onClick={() => router("/auth")}
                        variant="outlined"
                        sx={{ 
                            borderColor: '#4A90E2', 
                            color: '#4A90E2',
                            marginRight: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            '&:hover': { 
                                backgroundColor: '#4A90E2', 
                                color: 'white' 
                            }
                        }}
                    >
                        Register
                    </Button>
                    <Button
                        onClick={() => router("/auth")}
                        variant="contained"
                        sx={{ 
                            backgroundColor: '#4A90E2',
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            '&:hover': { backgroundColor: '#357ABD' }
                        }}
                    >
                        Login
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="modern-landing-hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <Typography 
                            variant="h1" 
                            sx={{ 
                                fontWeight: 'bold', 
                                color: '#FFFFFF',
                                marginBottom: { xs: 2, md: 3 },
                                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                                lineHeight: { xs: 1.2, md: 1.1 },
                                textAlign: { xs: 'center', lg: 'left' },
                                textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            <span style={{ color: '#FFD700' }}>Connect</span> with your
                            <br />
                            loved ones
                        </Typography>
                        
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                color: '#FFFFFF', 
                                marginBottom: { xs: 4, md: 5 },
                                lineHeight: 1.6,
                                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                                textAlign: { xs: 'center', lg: 'left' },
                                px: { xs: 1, lg: 0 },
                                fontWeight: 300,
                                textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                            }}
                        >
                            Bridge any distance with high-quality video calls, 
                            crystal-clear audio, and seamless collaboration tools.
                        </Typography>

                        {/* CTA Buttons */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 2, sm: 3 }, 
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'center', lg: 'flex-start' },
                            justifyContent: { xs: 'center', lg: 'flex-start' },
                            marginBottom: { xs: 4, md: 5 }
                        }}>
                            <Button
                                onClick={() => router("/auth")}
                                variant="contained"
                                size="large"
                                startIcon={<PlayArrowIcon />}
                                sx={{ 
                                    backgroundColor: '#FFD700',
                                    color: '#2C3E50',
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    padding: { xs: '12px 24px', sm: '16px 32px' },
                                    borderRadius: '50px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)',
                                    minWidth: { xs: '200px', sm: 'auto' },
                                    '&:hover': { 
                                        backgroundColor: '#FFC107',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 35px rgba(255, 215, 0, 0.4)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Get Started
                            </Button>
                            <Button
                                onClick={() => router("/aljk23")}
                                variant="outlined"
                                size="large"
                                startIcon={<VideoCallIcon />}
                                sx={{ 
                                    borderColor: '#FFFFFF',
                                    color: '#FFFFFF',
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    padding: { xs: '12px 24px', sm: '16px 32px' },
                                    borderRadius: '50px',
                                    fontWeight: 'bold',
                                    minWidth: { xs: '200px', sm: 'auto' },
                                    '&:hover': { 
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: '#FFD700',
                                        color: '#FFD700',
                                        transform: 'translateY(-2px)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Try as Guest
                            </Button>
                        </Box>

                        {/* Feature Highlights */}
                        <div className="landing-feature-grid">
                            <Card sx={{ 
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                color: 'white',
                                textAlign: 'center',
                                padding: 1,
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}>
                                <VideoCallIcon sx={{ fontSize: 32, color: '#FFD700', marginBottom: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    HD Video
                                </Typography>
                            </Card>
                            
                            <Card sx={{ 
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                color: 'white',
                                textAlign: 'center',
                                padding: 1,
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}>
                                <GroupIcon sx={{ fontSize: 32, color: '#FFD700', marginBottom: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Team Chat
                                </Typography>
                            </Card>
                            
                            <Card sx={{ 
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                color: 'white',
                                textAlign: 'center',
                                padding: 1,
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}>
                                <SecurityIcon sx={{ fontSize: 32, color: '#FFD700', marginBottom: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Secure
                                </Typography>
                            </Card>
                        </div>
                    </div>
                </div>
                
                <div className="hero-image">
                    <div className="landing-image-container">
                        <img src="/mobile.png" alt="Connectify Mobile" className="landing-hero-image" />
                        <div className="landing-floating-elements">
                            <div className="landing-floating-card landing-card-1">
                                <VideoCallIcon sx={{ color: '#4A90E2' }} />
                                <Typography variant="caption">Live Call</Typography>
                            </div>
                            <div className="landing-floating-card landing-card-2">
                                <GroupIcon sx={{ color: '#27AE60' }} />
                                <Typography variant="caption">10+ Users</Typography>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}