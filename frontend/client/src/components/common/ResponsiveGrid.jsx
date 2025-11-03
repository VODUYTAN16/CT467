// src/components/common/ResponsiveGrid.jsx
const ResponsiveGrid = ({ children, spacing = 3 }) => (
  <Grid container spacing={spacing}>
    {React.Children.map(children, (child) => (
      <Grid item xs={12} sm={6} md={4} lg={3}>
        {child}
      </Grid>
    ))}
  </Grid>
);
