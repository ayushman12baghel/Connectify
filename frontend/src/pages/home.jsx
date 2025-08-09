import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField, Card, CardContent, Typography, Box } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import ConnectifyIcon from '../components/ConnectifyIcon';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <div className="home-container">
            {/* Enhanced Navigation Bar */}
            <div className="enhanced-navBar">
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
                    <IconButton 
                        onClick={() => navigate("/history")}
                        sx={{ 
                            backgroundColor: '#f5f5f5', 
                            marginRight: { xs: 0.5, sm: 1 },
                            width: { xs: 40, sm: 44 },
                            height: { xs: 40, sm: 44 },
                            '&:hover': { backgroundColor: '#e0e0e0' }
                        }}
                    >
                        <RestoreIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </IconButton>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            marginRight: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        History
                    </Typography>

                    <Button 
                        onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                        variant="outlined"
                        size={window.innerWidth < 600 ? "small" : "medium"}
                        sx={{ 
                            borderColor: '#4A90E2', 
                            color: '#4A90E2',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            padding: { xs: '6px 12px', sm: '8px 16px' },
                            minWidth: { xs: '70px', sm: '80px' },
                            '&:hover': { 
                                backgroundColor: '#4A90E2', 
                                color: 'white' 
                            }
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <Typography 
                            variant="h2" 
                            sx={{ 
                                fontWeight: 'bold', 
                                color: '#FFFFFF',
                                marginBottom: { xs: 2, md: 2 },
                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                lineHeight: { xs: 1.2, md: 1.1 },
                                textAlign: { xs: 'center', lg: 'left' },
                                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            Connect Anywhere,
                            <br />
                            <span style={{ color: '#FFD700', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Anytime</span>
                        </Typography>
                        
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: '#FFFFFF', 
                                marginBottom: { xs: 3, md: 4 },
                                lineHeight: 1.6,
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                textAlign: { xs: 'center', lg: 'left' },
                                px: { xs: 1, sm: 2, lg: 0 },
                                fontWeight: 400,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            Experience seamless video conferencing with crystal-clear audio, 
                            HD video, and powerful collaboration tools. Join millions who trust 
                            Connectify for their important meetings.
                        </Typography>

                        {/* Meeting Code Input Section */}
                        <Card sx={{ 
                            padding: { xs: 2, sm: 3 }, 
                            backgroundColor: '#ffffff',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            borderRadius: '16px',
                            marginBottom: { xs: 3, md: 4 },
                            width: '100%',
                            maxWidth: '500px',
                            mx: { xs: 'auto', lg: 0 }
                        }}>
                            <CardContent sx={{ padding: { xs: '16px', sm: '24px' }, '&:last-child': { paddingBottom: { xs: '16px', sm: '24px' } } }}>
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        marginBottom: 2, 
                                        color: '#2C3E50',
                                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                        textAlign: 'center'
                                    }}
                                >
                                    Join a Meeting
                                </Typography>
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: { xs: 2, sm: 2 }, 
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: 'stretch'
                                }}>
                                    <TextField 
                                        onChange={e => setMeetingCode(e.target.value)}
                                        label="Enter Meeting Code" 
                                        variant="outlined"
                                        fullWidth
                                        size="medium"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#4A90E2',
                                                },
                                                height: { xs: '48px', sm: '56px' }
                                            },
                                            '& .MuiInputLabel-root': {
                                                fontSize: { xs: '0.9rem', sm: '1rem' }
                                            }
                                        }}
                                    />
                                    <Button 
                                        onClick={handleJoinVideoCall} 
                                        variant="contained"
                                        size="large"
                                        sx={{ 
                                            backgroundColor: '#4A90E2',
                                            minWidth: { xs: '100%', sm: '120px' },
                                            borderRadius: '8px',
                                            height: { xs: '48px', sm: '56px' },
                                            fontSize: { xs: '0.9rem', sm: '1rem' },
                                            fontWeight: 'bold',
                                            '&:hover': { backgroundColor: '#357ABD' }
                                        }}
                                    >
                                        Join Now
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Feature Cards */}
                        <div className="feature-grid">
                            <Card sx={{ 
                                padding: { xs: 1.5, sm: 2 }, 
                                textAlign: 'center', 
                                borderRadius: '12px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                }
                            }}>
                                <VideoCallIcon sx={{ 
                                    fontSize: { xs: 32, sm: 40 }, 
                                    color: '#4A90E2', 
                                    marginBottom: 1 
                                }} />
                                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    HD Video
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                >
                                    Crystal clear video quality
                                </Typography>
                            </Card>
                            
                            <Card sx={{ 
                                padding: { xs: 1.5, sm: 2 }, 
                                textAlign: 'center', 
                                borderRadius: '12px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                }
                            }}>
                                <GroupIcon sx={{ 
                                    fontSize: { xs: 32, sm: 40 }, 
                                    color: '#27AE60', 
                                    marginBottom: 1 
                                }} />
                                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Team Chat
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                >
                                    Real-time messaging
                                </Typography>
                            </Card>
                            
                            <Card sx={{ 
                                padding: { xs: 1.5, sm: 2 }, 
                                textAlign: 'center', 
                                borderRadius: '12px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                }
                            }}>
                                <SecurityIcon sx={{ 
                                    fontSize: { xs: 32, sm: 40 }, 
                                    color: '#E74C3C', 
                                    marginBottom: 1 
                                }} />
                                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Secure
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                >
                                    End-to-end encryption
                                </Typography>
                            </Card>
                        </div>
                    </div>
                </div>
                
                <div className="hero-image">
                    <div className="image-container">
                        <img src='/logo3.png' alt="Connectify" className="hero-logo" />
                        <div className="floating-elements">
                            <div className="floating-card card-1">
                                <VideoCallIcon sx={{ color: '#4A90E2' }} />
                                <Typography variant="caption">Active Call</Typography>
                            </div>
                            <div className="floating-card card-2">
                                <GroupIcon sx={{ color: '#27AE60' }} />
                                <Typography variant="caption">5 Participants</Typography>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default withAuth(HomeComponent)