import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  GitHub,
  Twitter,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

const MainFooter = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Report Issue', href: '/reports/new' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Gallery', href: '/gallery' },
        { label: 'Donate', href: '/donate' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Community Guidelines', href: '/guidelines' },
      ],
    },
    {
      title: 'Our Mission',
      description:
        'Transforming urban infrastructure through citizen engagement and smart technology.',
    },
    {
      title: 'Contact Info',
      items: [
        { icon: <LocationOn sx={{ fontSize: 16 }} />, text: '123 Smart City Rd, Urban Center' },
        { icon: <Phone sx={{ fontSize: 16 }} />, text: '+1 (555) 123-4567' },
        { icon: <Email sx={{ fontSize: 16 }} />, text: 'support@roadcare.org' },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 'auto',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {footerSections.map((section, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {section.title}
              </Typography>
              {section.links ? (
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {section.links.map((link, linkIndex) => (
                    <Box component="li" key={linkIndex} sx={{ mb: 1 }}>
                      <Link
                        href={link.href}
                        color="text.secondary"
                        underline="hover"
                        sx={{
                          '&:hover': {
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        {link.label}
                      </Link>
                    </Box>
                  ))}
                </Box>
              ) : section.description ? (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {section.description}
                </Typography>
              ) : (
                <Box>
                  {section.items.map((item, itemIndex) => (
                    <Box
                      key={itemIndex}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                    >
                      {item.icon}
                      <Typography variant="body2" color="text.secondary">
                        {item.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  R
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                RoadCare
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              © {currentYear} RoadCare. All rights reserved.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton
              color="inherit"
              href="https://github.com"
              target="_blank"
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <GitHub />
            </IconButton>
            <IconButton
              color="inherit"
              href="https://twitter.com"
              target="_blank"
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Twitter />
            </IconButton>
            <IconButton
              color="inherit"
              href="https://linkedin.com"
              target="_blank"
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <LinkedIn />
            </IconButton>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" align="center">
              Built with ❤️ for smarter cities
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Version 1.0.0 • Last updated: March 2024
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MainFooter;