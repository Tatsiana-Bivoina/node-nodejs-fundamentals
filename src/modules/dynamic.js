// Run: npm run modules:dynamic uppercase

const dynamic = async () => {
  const args = process.argv.slice(2);
  const pluginName = args[0];

  if (!pluginName) {
    console.log('Plugin not found');
    process.exit(1);
  }

  try {
    const module = await import(`./plugins/${pluginName}.js`);

    if (typeof module.run !== 'function') {
      console.log('Plugin not found');
      process.exit(1);
    }

    const result = await module.run();
    console.log(result);
  } catch (err) {
    console.log('Plugin not found');
    process.exit(1);
  }
};

await dynamic();
