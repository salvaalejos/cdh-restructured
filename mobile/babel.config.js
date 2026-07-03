module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
      ['@babel/plugin-transform-typescript', { 'allowDeclareFields': true }],
      ['@babel/plugin-transform-class-properties', { 'loose': true }],
      ['@babel/plugin-transform-private-methods', { 'loose': true }],
      'react-native-reanimated/plugin'
    ]
  };
};
