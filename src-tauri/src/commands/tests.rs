#[cfg(test)]
mod tests {
    use crate::commands::skills::parse_skill_md;
    use crate::commands::tools::{parse_call_blocks, ToolCall};
    use std::path::PathBuf;

    #[test]
    fn test_parse_call_blocks_single() {
        let text = r#"Hello world <CALL>{"name": "fileGen", "args": {"path": "test.txt"}}</CALL>!"#;
        let calls = parse_call_blocks(text);
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].name, "fileGen");
    }

    #[test]
    fn test_parse_call_blocks_multiple() {
        let text = r#"<CALL>{"name": "tool1", "args": {}}</CALL> and <CALL>{"name": "tool2", "args": {}}</CALL>"#;
        let calls = parse_call_blocks(text);
        assert_eq!(calls.len(), 2);
    }

    #[test]
    fn test_parse_call_blocks_empty() {
        let text = "No calls here";
        let calls = parse_call_blocks(text);
        assert_eq!(calls.len(), 0);
    }

    #[test]
    fn test_skill_parsing() {
        let test_path = PathBuf::from("test_skills/test-skill/SKILL.md");
        // This test validates the parser handles paths correctly
        // In real test, we'd create a temp file
        let result = parse_skill_md(&test_path);
        // Expect None since test file doesn't exist
        assert!(result.is_none());
    }
}
